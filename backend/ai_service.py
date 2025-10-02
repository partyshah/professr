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
    """Service for managing AI tutoring sessions

    IMPORTANT: Sessions are stored in memory. For production with multiple workers,
    consider using Redis or database storage to share sessions across workers.
    Currently requires single worker mode (--workers 1) to maintain session state.
    """

    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.sessions = {}  # Store conversation managers by session_id (in-memory)
        
    def initialize_session_with_text(self, session_id: str, reading_text: str, tutor_prompt: str = None, evaluation_prompt: str = None) -> Dict:
        """Initialize a new tutoring session with direct text content (faster than PDF extraction)"""
        try:
            from datetime import datetime

            # Create conversation manager for this session
            conv_manager = ConversationManager()

            # Use the reading text directly (no PDF extraction needed)
            pdf_context = f"=== Reading Material ===\n{reading_text}"

            # Store session data with start time and class-specific prompts
            self.sessions[session_id] = {
                'manager': conv_manager,
                'pdf_context': pdf_context,
                'conversation_history': [],
                'pdf_paths': [],  # No PDF paths since we're using text
                'start_time': datetime.now(),
                'reading_text': reading_text,  # Store the original text
                'tutor_prompt': tutor_prompt or TUTOR_SYSTEM_PROMPT,  # Use class prompt or default
                'evaluation_prompt': evaluation_prompt or EVALUATION_SYSTEM_PROMPT  # Use class prompt or default
            }

            logger.info(f"Initialized session {session_id} with reading text ({len(reading_text)} chars)")
            return {
                'success': True,
                'message': 'Session initialized with text',
                'text_length': len(reading_text)
            }

        except Exception as e:
            logger.error(f"Error initializing session {session_id} with text: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def initialize_session(self, session_id: str, pdf_paths: List[str], tutor_prompt: str = None, evaluation_prompt: str = None) -> Dict:
        """Initialize a new tutoring session with PDF context"""
        try:
            from datetime import datetime

            # Extract text from PDFs
            pdf_texts = extract_texts_from_pdfs(pdf_paths)
            pdf_context = format_pdf_context(pdf_texts)

            # Create conversation manager for this session
            conv_manager = ConversationManager()

            # Store session data with start time and class-specific prompts
            self.sessions[session_id] = {
                'manager': conv_manager,
                'pdf_context': pdf_context,
                'conversation_history': [],
                'pdf_paths': pdf_paths,
                'start_time': datetime.now(),
                'tutor_prompt': tutor_prompt or TUTOR_SYSTEM_PROMPT,  # Use class prompt or default
                'evaluation_prompt': evaluation_prompt or EVALUATION_SYSTEM_PROMPT  # Use class prompt or default
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

            # Get tutor prompt from session (use default if not set)
            tutor_prompt = session_data.get('tutor_prompt', TUTOR_SYSTEM_PROMPT)

            # Format messages for API with time context
            messages = conv_manager.format_for_api(
                system_prompt=tutor_prompt,
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
    
    def evaluate_session(self, session_id: str, db_session=None) -> Dict:
        """Evaluate the complete session performance"""

        conversation_history = None
        question_count = 0

        # First try to get from memory
        if session_id in self.sessions:
            logger.info(f"Evaluating session {session_id} from memory")
            session_data = self.sessions[session_id]
            conversation_history = session_data['conversation_history']
            question_count = session_data['manager'].question_count
        # Otherwise try to recover from database if available
        elif db_session:
            try:
                # Import here to avoid circular dependency
                from models import Session

                # Try to find existing session in database
                parts = session_id.split('_')
                if len(parts) >= 3:
                    student_id = int(parts[1])
                    assignment_id = int(parts[2])

                    existing_session = db_session.query(Session).filter(
                        Session.student_id == student_id,
                        Session.assignment_id == assignment_id
                    ).first()

                    if existing_session and existing_session.full_transcript:
                        # Convert database transcript format to conversation_history format
                        conversation_history = []
                        for turn in existing_session.full_transcript:
                            if turn['speaker'] == 'student':
                                conversation_history.append({'role': 'user', 'content': turn['text']})
                            elif turn['speaker'] == 'ai':
                                conversation_history.append({'role': 'assistant', 'content': turn['text']})

                        # Count AI questions
                        question_count = len([msg for msg in conversation_history if msg['role'] == 'assistant'])
                        logger.info(f"Successfully recovered session {session_id} from database (found {len(conversation_history)} messages)")
            except Exception as e:
                logger.error(f"Error recovering session from database: {str(e)}")

        if not conversation_history:
            logger.error(f"Session {session_id} not found in memory or database")
            return {'error': 'Session not found'}

        # Get evaluation prompt from session if available, otherwise use default
        evaluation_prompt = EVALUATION_SYSTEM_PROMPT
        if session_id in self.sessions:
            evaluation_prompt = self.sessions[session_id].get('evaluation_prompt', EVALUATION_SYSTEM_PROMPT)

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
                    'question_count': question_count
                }
            
            # Format conversation for evaluation with clear speaker labels
            conversation_text = "\n".join([
                f"{'STUDENT' if msg['role'] == 'user' else 'AI PROFESSOR'}: {msg['content']}" 
                for msg in conversation_history
            ])
            
            # Call OpenAI for evaluation using class-specific evaluation prompt
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": evaluation_prompt},
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

            # Log color counts for debugging
            logger.info(f"Session {session_id} evaluation colors - Green: {green_count}, Yellow: {yellow_count}, Red: {red_count}")

            # Apply 50% majority rule (2 or more out of 4 categories = majority)
            if green_count >= 2:  # 50% or more green (2+ out of 4)
                category = "green"
                score = 90 if green_count >= 3 else 85  # Higher score for 3-4 greens
            elif yellow_count >= 2:  # 50% or more yellow (2+ out of 4)
                category = "yellow"
                score = 75
            elif red_count >= 2:  # 50% or more red (2+ out of 4)
                category = "red"
                score = 60
            else:  # No majority (mixed 1-1-1-1 type results), default to yellow
                category = "yellow"
                score = 70

            # Validate: Check if the AI's "Overall:" line matches our calculation
            overall_line_match = None
            for line in evaluation.split('\n'):
                if line.strip().lower().startswith('overall:'):
                    if 'green' in line.lower():
                        overall_line_match = 'green'
                    elif 'yellow' in line.lower():
                        overall_line_match = 'yellow'
                    elif 'red' in line.lower():
                        overall_line_match = 'red'
                    break

            # Log validation results
            if overall_line_match and overall_line_match != category:
                logger.warning(f"Session {session_id}: Color mismatch! AI said Overall: {overall_line_match}, but our calculation: {category}")
            else:
                logger.info(f"Session {session_id}: Color validation passed - {category}")

            # Use our calculated category (don't trust the AI's "Overall" line)
            
            return {
                'score': score,
                'category': category,
                'feedback': evaluation,
                'question_count': question_count
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
            'pdf_count': len(session_data.get('pdf_paths', [])),
            'using_text': 'reading_text' in session_data
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
            session_data = self.sessions[session_id]
            message_count = len(session_data.get('conversation_history', []))
            del self.sessions[session_id]
            logger.info(f"Cleaned up session {session_id} from memory (had {message_count} messages)")
        else:
            logger.warning(f"Attempted to cleanup non-existent session {session_id}")