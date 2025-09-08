"""AI Service for handling tutoring conversations"""
import os
import logging
from typing import List, Dict, Optional, Tuple
import openai
from conversation_manager import ConversationManager
from pdf_utils import extract_texts_from_pdfs, format_pdf_context
from prompts import TUTOR_SYSTEM_PROMPT, EVALUATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class AITutorService:
    """Service for managing AI tutoring sessions"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.sessions = {}  # Store conversation managers by session_id
        
    def initialize_session(self, session_id: str, pdf_paths: List[str]) -> Dict:
        """Initialize a new tutoring session with PDF context"""
        try:
            from datetime import datetime
            
            # Extract text from PDFs
            pdf_texts = extract_texts_from_pdfs(pdf_paths)
            pdf_context = format_pdf_context(pdf_texts)
            
            # Create conversation manager for this session
            conv_manager = ConversationManager()
            
            # Store session data with start time
            self.sessions[session_id] = {
                'manager': conv_manager,
                'pdf_context': pdf_context,
                'conversation_history': [],
                'pdf_paths': pdf_paths,
                'start_time': datetime.now()
            }
            
            logger.info(f"Initialized session {session_id} with {len(pdf_paths)} PDFs")
            return {
                'success': True,
                'message': 'Session initialized',
                'pdf_count': len(pdf_texts)
            }
            
        except Exception as e:
            logger.error(f"Error initializing session {session_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_ai_response(self, session_id: str, user_message: str) -> Tuple[str, Dict]:
        """Get AI response for a user message in a session"""
        from datetime import datetime
        
        # Get or create session - try to auto-initialize if missing
        if session_id not in self.sessions:
            # Try to extract assignment_id from session_id format: session_{student_id}_{assignment_id}_{timestamp}
            try:
                parts = session_id.split('_')
                if len(parts) >= 3:
                    assignment_id = int(parts[2])
                    # Auto-initialize session with default PDFs
                    default_pdfs = ["week1/reading1.pdf", "week1/reading2.pdf"]
                    init_result = self.initialize_session(session_id, default_pdfs)
                    if not init_result['success']:
                        return "Could not initialize session. Please start a new assessment.", {'error': 'Auto-init failed'}
                else:
                    return "Session not found. Please start a new assessment.", {'error': 'Session not found'}
            except:
                return "Session not found. Please start a new assessment.", {'error': 'Session not found'}
        
        session_data = self.sessions[session_id]
        conv_manager = session_data['manager']
        pdf_context = session_data['pdf_context']
        conversation_history = session_data['conversation_history']
        
        # Calculate elapsed time and remaining time
        start_time = session_data.get('start_time', datetime.now())
        elapsed_seconds = int((datetime.now() - start_time).total_seconds())
        remaining_seconds = max(0, 600 - elapsed_seconds)  # 10-minute session
        
        # Check for auto-end condition (≤20 seconds remaining)
        if remaining_seconds <= 20:
            logger.info(f"Auto-ending session {session_id} with {remaining_seconds} seconds remaining")
            
            # Add farewell message to conversation history
            farewell_message = "Thank you for a good conversation. Let's wrap up here."
            conversation_history.append({"role": "user", "content": user_message})
            conversation_history.append({"role": "assistant", "content": farewell_message})
            
            metadata = {
                'question_count': conv_manager.question_count,
                'phase': 'wrap_up',
                'should_wrap_up': True,
                'auto_end': True,
                'elapsed_seconds': elapsed_seconds,
                'minutes_elapsed': round(elapsed_seconds / 60.0, 1),
                'remaining_seconds': remaining_seconds,
                'token_usage': {'input_tokens': 0, 'output_tokens': 0, 'total_tokens': 0}
            }
            
            return farewell_message, metadata
        
        try:
            # Check if this should be the final question
            final_question = remaining_seconds <= 45
            
            # Format messages for API with time context
            messages = conv_manager.format_for_api(
                system_prompt=TUTOR_SYSTEM_PROMPT,
                pdf_context=pdf_context,
                conversation_history=conversation_history,
                new_message=user_message,
                elapsed_seconds=elapsed_seconds,
                final_question=final_question
            )
            
            # Call OpenAI API with GPT-4o-mini for cost efficiency
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=300  # Keep responses concise
            )
            
            ai_response = response.choices[0].message.content
            
            # Update conversation history
            conversation_history.append({"role": "user", "content": user_message})
            conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Update phase and question count based on elapsed time
            conv_manager.update_phase(elapsed_seconds)
            
            # Calculate token usage for monitoring
            token_usage = {
                'input_tokens': response.usage.prompt_tokens,
                'output_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens,
                'estimated_cost': (response.usage.prompt_tokens * 0.00015 + 
                                 response.usage.completion_tokens * 0.0006) / 1000
            }
            
            # Check timing thresholds
            minutes_elapsed = elapsed_seconds / 60.0
            should_wrap_up = minutes_elapsed >= 9.5  # Wrap up in final 30 seconds
            final_question = remaining_seconds <= 45  # One more question only
            
            metadata = {
                'question_count': conv_manager.question_count,
                'phase': conv_manager.phase,
                'should_wrap_up': should_wrap_up,
                'final_question': final_question,
                'auto_end': False,
                'elapsed_seconds': elapsed_seconds,
                'minutes_elapsed': round(minutes_elapsed, 1),
                'remaining_seconds': remaining_seconds,
                'token_usage': token_usage
            }
            
            logger.info(f"Session {session_id} - Q{conv_manager.question_count} - Tokens: {token_usage['total_tokens']}")
            
            return ai_response, metadata
            
        except Exception as e:
            logger.error(f"Error getting AI response for session {session_id}: {str(e)}")
            return f"I apologize, but I encountered an error. Let's continue: {str(e)}", {'error': str(e)}
    
    def evaluate_session(self, session_id: str) -> Dict:
        """Evaluate the complete session performance"""
        
        if session_id not in self.sessions:
            return {'error': 'Session not found'}
        
        session_data = self.sessions[session_id]
        conversation_history = session_data['conversation_history']
        
        try:
            # Check student participation levels before evaluation
            student_messages = [msg for msg in conversation_history if msg['role'] == 'user']
            total_student_chars = sum(len(msg['content'].strip()) for msg in student_messages)
            
            # If insufficient student participation, return appropriate feedback
            if len(student_messages) <= 1 or total_student_chars < 50:
                logger.warning(f"Insufficient student participation in session {session_id}: {len(student_messages)} messages, {total_student_chars} chars")
                return {
                    'score': 40,
                    'category': 'red',
                    'feedback': 'Explain and Apply Institutions & Principles: [Red] - Student did not provide sufficient responses to demonstrate understanding of institutional concepts.\n\nInterpret and Compare Theories & Justifications: [Red] - Minimal student participation prevented assessment of theoretical analysis skills.\n\nEvaluate Effectiveness & Fairness: [Red] - Student did not engage enough to show critical evaluation abilities.\n\nPropose and Justify Reforms: [Red] - No meaningful reform proposals were offered by the student.\n\nOverall: [Red] - Session ended with insufficient student participation to assess learning objectives.',
                    'question_count': session_data['manager'].question_count
                }
            
            # Format conversation for evaluation with clear speaker labels
            conversation_text = "\n".join([
                f"{'STUDENT' if msg['role'] == 'user' else 'AI PROFESSOR'}: {msg['content']}" 
                for msg in conversation_history
            ])
            
            # Call OpenAI for evaluation
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Evaluate this student assessment:\n\n{conversation_text}"}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            evaluation = response.choices[0].message.content
            
            # Determine overall score/category from the evaluation text
            # Look for Green/Yellow/Red indicators to determine overall performance
            evaluation_lower = evaluation.lower()
            green_count = evaluation_lower.count('green')
            yellow_count = evaluation_lower.count('yellow')
            red_count = evaluation_lower.count('red')
            
            # Determine category based on color distribution
            if green_count >= 3:  # Mostly green
                category = "green"
                score = 90
            elif green_count >= 2 and yellow_count <= 2:  # More green than yellow/red
                category = "green"
                score = 85
            elif yellow_count >= 2 and red_count <= 1:  # Mostly yellow with little red
                category = "yellow"
                score = 75
            elif red_count >= 2:  # Multiple reds
                category = "red"
                score = 60
            else:  # Mixed results, lean toward yellow
                category = "yellow"
                score = 70
            
            return {
                'score': score,
                'category': category,
                'feedback': evaluation,
                'question_count': session_data['manager'].question_count
            }
            
        except Exception as e:
            logger.error(f"Error evaluating session {session_id}: {str(e)}")
            return {'error': str(e)}
    
    def get_session_stats(self, session_id: str) -> Dict:
        """Get statistics for a session"""
        
        if session_id not in self.sessions:
            return {'error': 'Session not found'}
        
        session_data = self.sessions[session_id]
        conv_manager = session_data['manager']
        
        return {
            'question_count': conv_manager.question_count,
            'phase': conv_manager.phase,
            'message_count': len(session_data['conversation_history']),
            'pdf_count': len(session_data['pdf_paths'])
        }
    
    def get_formatted_transcript(self, session_id: str) -> List[Dict]:
        """Get conversation history formatted for database storage"""
        
        if session_id not in self.sessions:
            return []
        
        session_data = self.sessions[session_id]
        conversation_history = session_data['conversation_history']
        
        # Transform AI service format to expected transcript format
        formatted_transcript = []
        for msg in conversation_history:
            if msg['role'] == 'user':
                formatted_transcript.append({
                    'speaker': 'student',
                    'text': msg['content']
                })
            elif msg['role'] == 'assistant':
                formatted_transcript.append({
                    'speaker': 'ai',
                    'text': msg['content']
                })
        
        return formatted_transcript
    
    def cleanup_session(self, session_id: str):
        """Clean up session data to free memory"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Cleaned up session {session_id}")