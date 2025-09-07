"""Conversation management with smart truncation"""
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConversationManager:
    """Manages conversation history with smart truncation to optimize token usage"""
    
    def __init__(self, max_recent_messages: int = 8):
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
        ai_phrases_used = set()
        
        for i, msg in enumerate(messages):
            if msg['role'] == 'assistant':
                # Track key phrases the AI has already used to avoid repetition
                content = msg.get('content', '').lower()
                if 'highest good' in content:
                    ai_phrases_used.add('highest good and happiness')
                if 'political animal' in content:
                    ai_phrases_used.add('political animals concept')
                if 'city-state' in content:
                    ai_phrases_used.add('city-state definition')
                
                # Extract topics discussed
                if i > 0 and messages[i-1]['role'] == 'user':
                    user_response = messages[i-1]['content'][:80]
                    ai_question = msg['content'][:80]
                    topics_covered.append(f"Discussed: {user_response.strip()}")
        
        # Create concise summary with repetition prevention
        summary_parts = []
        if topics_covered:
            summary_parts.append("Topics already covered: " + "; ".join(topics_covered[-3:]))
        if ai_phrases_used:
            summary_parts.append("Key concepts already explained: " + ", ".join(list(ai_phrases_used)))
        
        summary_text = "\n".join(summary_parts) if summary_parts else "Early conversation about the readings"
        
        return {
            "role": "system",
            "content": f"[SUMMARY OF EARLIER CONVERSATION]\n{summary_text}\nAvoid repeating these exact phrases or concepts. Build on what was already discussed.\n[END SUMMARY]"
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