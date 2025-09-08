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
        
        # Calculate elapsed time
        start_time = session_data.get('start_time', datetime.now())
        elapsed_seconds = int((datetime.now() - start_time).total_seconds())
        
        try:
            # Format messages for API with time context
            messages = conv_manager.format_for_api(
                system_prompt=TUTOR_SYSTEM_PROMPT,
                pdf_context=pdf_context,
                conversation_history=conversation_history,
                new_message=user_message,
                elapsed_seconds=elapsed_seconds
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
            
            # Check if conversation should wrap up based on time
            minutes_elapsed = elapsed_seconds / 60.0
            should_wrap_up = minutes_elapsed >= 9.5  # Wrap up in final 30 seconds
            
            metadata = {
                'question_count': conv_manager.question_count,
                'phase': conv_manager.phase,
                'should_wrap_up': should_wrap_up,
                'elapsed_seconds': elapsed_seconds,
                'minutes_elapsed': round(minutes_elapsed, 1),
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
            # Format conversation for evaluation
            conversation_text = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}" 
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
            
            # Parse evaluation to extract score and category
            # This is a simple parsing - you might want to make it more robust
            lines = evaluation.split('\n')
            score = 75  # Default score
            category = "good"  # Default category
            
            for line in lines:
                if 'score' in line.lower() and ':' in line:
                    try:
                        score = int(''.join(filter(str.isdigit, line.split(':')[1])))
                    except:
                        pass
                elif 'category' in line.lower() and ':' in line:
                    cat_text = line.split(':')[1].strip().lower()
                    if 'excellent' in cat_text:
                        category = "excellent"
                    elif 'good' in cat_text:
                        category = "good"
                    elif 'satisfactory' in cat_text:
                        category = "satisfactory"
                    else:
                        category = "needs improvement"
            
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