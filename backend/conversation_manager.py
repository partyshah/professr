"""Conversation management with smart truncation"""
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConversationManager:
    """Manages conversation history with smart truncation to optimize token usage"""
    
    def __init__(self, max_recent_messages: int = 10):
        self.max_recent_messages = max_recent_messages
        self.question_count = 0
        self.phase = "opening"  # opening, follow_up, final, wrap_up
        
    def update_phase(self):
        """Update conversation phase based on question count"""
        self.question_count += 1
        
        if self.question_count == 1:
            self.phase = "opening"
        elif self.question_count <= 5:
            self.phase = "follow_up"
        elif self.question_count == 6:
            self.phase = "final"
        else:
            self.phase = "wrap_up"
    
    def get_truncated_history(self, full_history: List[Dict]) -> List[Dict]:
        """
        Intelligently truncate conversation history to manage tokens
        
        Strategy:
        - Questions 1-3: Send full history
        - Questions 4-5: Summarize Q1-2, keep Q3-current in full
        - Question 6+: Summarize all but last 4-6 messages
        """
        
        if self.question_count <= 3:
            # Early conversation: send everything
            return full_history
        
        elif self.question_count <= 5:
            # Mid conversation: summarize early parts
            if len(full_history) <= self.max_recent_messages:
                return full_history
            
            # Create summary of early messages
            early_messages = full_history[:-self.max_recent_messages]
            recent_messages = full_history[-self.max_recent_messages:]
            
            summary = self._create_summary(early_messages)
            return [summary] + recent_messages
        
        else:
            # Late conversation: aggressive summarization
            if len(full_history) <= 6:
                return full_history
            
            # Keep only last 6 messages with summary
            early_messages = full_history[:-6]
            recent_messages = full_history[-6:]
            
            summary = self._create_summary(early_messages)
            return [summary] + recent_messages
    
    def _create_summary(self, messages: List[Dict]) -> Dict:
        """Create a summary of conversation messages"""
        # Extract key points from messages
        key_points = []
        for msg in messages:
            if msg['role'] == 'assistant' and 'question' in msg.get('content', '').lower():
                # Extract questions asked
                key_points.append(f"Q: {msg['content'][:100]}...")
            elif msg['role'] == 'user':
                # Extract student responses (brief)
                key_points.append(f"A: {msg['content'][:50]}...")
        
        summary_text = "Previous discussion summary:\n" + "\n".join(key_points[-4:])  # Keep last 4 Q&A pairs
        
        return {
            "role": "system",
            "content": f"[CONVERSATION SUMMARY]\n{summary_text}\n[END SUMMARY]"
        }
    
    def format_for_api(self, system_prompt: str, pdf_context: str, 
                       conversation_history: List[Dict], new_message: str) -> List[Dict]:
        """Format the complete message list for OpenAI API"""
        
        # Combine system prompt with PDF context
        full_system_prompt = f"{system_prompt}\n\n## READING MATERIALS:\n{pdf_context}"
        
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