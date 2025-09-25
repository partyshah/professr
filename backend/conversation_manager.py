"""Conversation management with smart truncation"""
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConversationManager:
    """Manages conversation history with smart truncation to optimize token usage"""
    
    def __init__(self, max_recent_messages: int = 8, total_session_minutes: int = 10):
        self.max_recent_messages = max_recent_messages
        self.question_count = 0
        self.total_session_minutes = total_session_minutes
        self.phase = "opening"  # opening, exploration, synthesis, wrap_up
        
    def update_phase(self, elapsed_seconds: int):
        """Update conversation phase based on elapsed time"""
        self.question_count += 1
        
        minutes_elapsed = elapsed_seconds / 60.0
        
        if minutes_elapsed < 2:
            # First 2 minutes: Opening, establish understanding
            self.phase = "opening"
        elif minutes_elapsed < 8:
            # Minutes 2-8: Deep exploration with challenges
            self.phase = "exploration"
        elif minutes_elapsed < 9.5:
            # Minutes 8-9.5: Synthesis and connections
            self.phase = "synthesis"
        else:
            # Final 30 seconds: Wrap up
            self.phase = "wrap_up"
    
    def get_truncated_history(self, full_history: List[Dict]) -> List[Dict]:
        """
        Intelligently truncate conversation history to manage tokens while preventing repetition
        
        Strategy:
        - Questions 1-4: Send full history (critical for coherence)
        - Questions 5-6: Keep last 8-10 messages in full, summarize older ones
        - Always preserve complete recent exchanges (user + assistant pairs)
        """
        
        if self.question_count <= 4:
            # Early conversation: send everything to maintain coherence
            return full_history
        
        else:
            # Mid/Late conversation: preserve recent exchanges
            if len(full_history) <= self.max_recent_messages:
                return full_history
            
            # Keep recent complete exchanges
            recent_messages = full_history[-self.max_recent_messages:]
            early_messages = full_history[:-self.max_recent_messages]
            
            # Only summarize if there are enough early messages to warrant it
            if len(early_messages) >= 4:
                summary = self._create_summary(early_messages)
                return [summary] + recent_messages
            else:
                # If not many early messages, just keep everything
                return full_history
    
    def _create_summary(self, messages: List[Dict]) -> Dict:
        """Create a summary of conversation messages"""
        # Group messages into Q&A pairs and extract themes discussed
        topics_covered = []

        for i, msg in enumerate(messages):
            if msg['role'] == 'assistant':
                # Dynamically track actual concepts from the conversation
                # Instead of looking for specific philosophers, extract what was actually discussed
                content = msg.get('content', '')

                # Extract topics discussed based on actual conversation
                if i > 0 and messages[i-1]['role'] == 'user':
                    user_response = messages[i-1]['content'][:80]
                    ai_question = msg['content'][:80]
                    topics_covered.append(f"Discussed: {user_response.strip()}")
        
        # Create concise summary with repetition prevention
        summary_parts = []
        if topics_covered:
            summary_parts.append("Topics already covered: " + "; ".join(topics_covered[-3:]))

        summary_text = "\n".join(summary_parts) if summary_parts else "Early conversation about the readings"

        return {
            "role": "system",
            "content": f"[SUMMARY OF EARLIER CONVERSATION]\n{summary_text}\nBuild on what was already discussed without repeating the same questions.\n[END SUMMARY]"
        }
    
    def format_for_api(self, system_prompt: str, pdf_context: str, 
                       conversation_history: List[Dict], new_message: str,
                       elapsed_seconds: int = 0, final_question: bool = False) -> List[Dict]:
        """Format the complete message list for OpenAI API"""
        
        minutes_elapsed = elapsed_seconds / 60.0
        remaining_minutes = max(0, self.total_session_minutes - minutes_elapsed)
        
        # Add time context to system prompt
        time_context = f"\n\n## CURRENT SESSION STATUS:\n"
        time_context += f"- Time elapsed: {minutes_elapsed:.1f} minutes\n"
        time_context += f"- Time remaining: {remaining_minutes:.1f} minutes\n"
        time_context += f"- Current phase: {self.phase}\n"
        time_context += f"- Questions asked so far: {self.question_count}\n"
        
        # Special timing guidance
        if final_question:
            time_context += "\n⚠️ FINAL QUESTION: Less than 45 seconds remaining. Ask ONE more meaningful question only."
        
        # Phase-specific guidance
        if self.phase == "opening":
            time_context += "\nFocus: Establish baseline understanding with a clear, accessible question."
        elif self.phase == "exploration":
            time_context += "\nFocus: Challenge, probe deeper, introduce complications or counterpoints."
        elif self.phase == "synthesis":
            time_context += "\nFocus: Connect to larger themes, modern applications, broader implications."
        elif self.phase == "wrap_up":
            time_context += "\nFocus: Provide a brief reflective synthesis (no new questions)."
        
        # Combine system prompt with PDF context and time context
        full_system_prompt = f"{system_prompt}\n\n## READING MATERIALS:\n{pdf_context}{time_context}"
        
        messages = [
            {"role": "system", "content": full_system_prompt}
        ]
        
        # Add truncated conversation history
        truncated_history = self.get_truncated_history(conversation_history)
        messages.extend(truncated_history)
        
        # Add the new user message
        messages.append({"role": "user", "content": new_message})
        
        return messages
    
    def should_wrap_up(self) -> bool:
        """Check if conversation should wrap up"""
        return self.question_count >= 6