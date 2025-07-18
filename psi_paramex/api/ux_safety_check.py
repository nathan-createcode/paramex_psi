from typing import Dict, List, Any
import re

class UXSafetyChecker:
    """
    Safety checker for user experience and content moderation
    """
    
    def __init__(self):
        # Inappropriate content keywords
        self.inappropriate_keywords = [
            'hack', 'illegal', 'fraud', 'scam', 'cheat',
            'drugs', 'violence', 'hate', 'discriminat',
            'adult content', 'explicit'
        ]
        
        # Off-topic keywords (not related to project management)
        self.off_topic_keywords = [
            'dating', 'relationship', 'personal life',
            'medical advice', 'legal advice', 'financial investment',
            'gambling', 'politics', 'religion'
        ]
        
        # Project management related keywords (positive signals)
        self.project_keywords = [
            'project', 'deadline', 'client', 'timeline', 'budget',
            'scope', 'team', 'management', 'planning', 'workflow',
            'productivity', 'freelance', 'task', 'milestone',
            'communication', 'estimation', 'pricing', 'proposal'
        ]
        
        # Excessive length or spam indicators
        self.spam_indicators = [
            r'(.)\1{10,}',  # Repeated characters
            r'[A-Z]{20,}',  # Excessive caps
            r'[!?]{5,}',    # Excessive punctuation
        ]
    
    def check_user_input(self, user_message: str) -> Dict[str, Any]:
        """
        Check user input for safety and appropriateness
        
        Args:
            user_message: The user's input message
            
        Returns:
            Dictionary with safety check results
        """
        message_lower = user_message.lower()
        issues = []
        
        # Check for inappropriate content
        for keyword in self.inappropriate_keywords:
            if keyword in message_lower:
                issues.append(f"inappropriate_content: {keyword}")
        
        # Check for off-topic content
        off_topic_matches = [kw for kw in self.off_topic_keywords if kw in message_lower]
        if off_topic_matches and not any(pm in message_lower for pm in self.project_keywords):
            issues.append(f"off_topic: {', '.join(off_topic_matches)}")
        
        # Check for spam indicators
        for pattern in self.spam_indicators:
            if re.search(pattern, user_message):
                issues.append("spam_pattern")
                break
        
        # Check message length
        if len(user_message) > 2000:
            issues.append("excessive_length")
        elif len(user_message.strip()) < 3:
            issues.append("too_short")
        
        # Determine if input is safe
        is_safe = len(issues) == 0
        
        # Generate appropriate response/suggestion
        suggestion = self._generate_safety_suggestion(issues)
        
        return {
            "is_safe": is_safe,
            "issues": issues,
            "suggestion": suggestion,
            "severity": self._get_severity_level(issues)
        }
    
    def check_ai_response(self, ai_response: str) -> Dict[str, Any]:
        """
        Check AI response for potential issues
        
        Args:
            ai_response: The AI's response
            
        Returns:
            Dictionary with safety check results
        """
        issues = []
        
        # Check for inappropriate content in response
        response_lower = ai_response.lower()
        for keyword in self.inappropriate_keywords:
            if keyword in response_lower:
                issues.append(f"inappropriate_content: {keyword}")
        
        # Check for extremely long responses (might be hallucination)
        if len(ai_response) > 3000:
            issues.append("excessive_length")
        
        # Check for repetitive content (sign of model issues)
        if self._has_excessive_repetition(ai_response):
            issues.append("repetitive_content")
        
        # Check for completeness (response should be substantive)
        if len(ai_response.strip()) < 20:
            issues.append("too_brief")
        
        is_safe = len(issues) == 0
        
        return {
            "is_safe": is_safe,
            "issues": issues,
            "severity": self._get_severity_level(issues)
        }
    
    def moderate_conversation(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """
        Check entire conversation for patterns or issues
        
        Args:
            conversation_history: List of conversation messages
            
        Returns:
            Dictionary with moderation results
        """
        issues = []
        
        if not conversation_history:
            return {"is_safe": True, "issues": [], "recommendations": []}
        
        user_messages = [msg for msg in conversation_history if msg.get('type') == 'user']
        
        # Check for excessive messaging frequency
        if len(user_messages) > 50:
            issues.append("excessive_messaging")
        
        # Check for repetitive questions
        user_contents = [msg.get('content', '').lower() for msg in user_messages]
        if len(set(user_contents)) < len(user_contents) * 0.7:  # Less than 70% unique
            issues.append("repetitive_questions")
        
        recommendations = self._generate_conversation_recommendations(conversation_history)
        
        return {
            "is_safe": len(issues) == 0,
            "issues": issues,
            "recommendations": recommendations,
            "conversation_length": len(conversation_history),
            "user_message_count": len(user_messages)
        }
    
    def _generate_safety_suggestion(self, issues: List[str]) -> str:
        """Generate appropriate suggestion based on issues found"""
        if not issues:
            return ""
        
        if any("inappropriate_content" in issue for issue in issues):
            return "Please keep our conversation focused on professional project management topics."
        
        if any("off_topic" in issue for issue in issues):
            return "I specialize in project management advice. Could you ask about project planning, client management, or workflow optimization instead?"
        
        if any("spam_pattern" in issue for issue in issues):
            return "Please provide a clear, well-formatted question about your project management needs."
        
        if "excessive_length" in issues:
            return "Could you please shorten your question and focus on the specific project management challenge you're facing?"
        
        if "too_short" in issues:
            return "Could you provide more details about the project management topic you'd like help with?"
        
        return "Please rephrase your question to focus on project management topics."
    
    def _get_severity_level(self, issues: List[str]) -> str:
        """Determine severity level of issues"""
        if not issues:
            return "none"
        
        if any("inappropriate_content" in issue for issue in issues):
            return "high"
        
        if any(issue in ["spam_pattern", "excessive_length"] for issue in issues):
            return "medium"
        
        return "low"
    
    def _has_excessive_repetition(self, text: str) -> bool:
        """Check for excessive repetition in text"""
        sentences = text.split('.')
        if len(sentences) < 3:
            return False
        
        # Check for repeated sentences
        unique_sentences = set(s.strip().lower() for s in sentences if s.strip())
        repetition_ratio = len(unique_sentences) / len([s for s in sentences if s.strip()])
        
        return repetition_ratio < 0.7  # Less than 70% unique sentences
    
    def _generate_conversation_recommendations(self, conversation_history: List[Dict]) -> List[str]:
        """Generate recommendations for improving conversation"""
        recommendations = []
        
        user_messages = [msg for msg in conversation_history if msg.get('type') == 'user']
        
        if len(user_messages) > 20:
            recommendations.append("Consider summarizing your main project challenges for more focused advice")
        
        if len(conversation_history) > 30:
            recommendations.append("You might want to start a new conversation for fresh context")
        
        # Check if user is asking varied questions
        topics = []
        for msg in user_messages[-10:]:  # Last 10 messages
            content = msg.get('content', '').lower()
            if any(keyword in content for keyword in ['timeline', 'deadline', 'schedule']):
                topics.append('timeline')
            if any(keyword in content for keyword in ['budget', 'cost', 'price', 'money']):
                topics.append('budget')
            if any(keyword in content for keyword in ['client', 'customer', 'communication']):
                topics.append('client')
        
        unique_topics = set(topics)
        if len(unique_topics) > 3:
            recommendations.append("You're covering many topics - consider focusing on one challenge at a time")
        
        return recommendations

# Global instance
ux_safety_checker = UXSafetyChecker()
