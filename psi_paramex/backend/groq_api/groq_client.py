import os
from groq import Groq
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GroqLlamaClient:
    def __init__(self):
        """Initialize Groq client with Meta Llama 4 Scout model"""
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = Groq(api_key=self.api_key)
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"  # Using more conversational model
        # Note: Using Llama 3.1 70B which is better for conversations
        
        # System prompt for project advisory
        self.system_prompt = """You are a helpful AI assistant who can help with freelance project management topics. 

Your approach:
- ALWAYS respond directly to what the user asks
- Don't volunteer project information unless they specifically ask for it
- Be conversational and natural in your responses
- Only give project-related advice when the user's question is about projects
- If they ask general questions, give general answers
- If they ask about non-project topics, help with those topics

Your capabilities when asked:
- Project planning and time management advice
- Client relationship guidance  
- Budget and resource planning
- General business and work advice
- Any other topics the user wants to discuss

When project data is provided:
- Only reference it if the user's question is clearly about their projects
- Don't force project analysis into every response
- Use the data to give specific advice only when relevant

Communication style:
- Listen to what the user actually wants to know
- Answer their specific question directly
- Be helpful and friendly
- Ask follow-up questions if you need clarification
- Don't repeat information unnecessarily
- Match the user's tone and topic focus

Most important: Respond to what the user is actually asking about. Don't always steer the conversation toward projects unless that's what they want to discuss."""

    async def get_project_advice(self, user_message: str, conversation_history: List[Dict] = None) -> str:
        """
        Get project advice from Meta Llama model
        
        Args:
            user_message: The user's question or request
            conversation_history: Previous conversation context
            
        Returns:
            AI-generated project advice
        """
        try:
            # Prepare messages for the API
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-6:]:  # Last 6 messages for context (reduced from 10)
                    role = "user" if msg["type"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Call Groq API
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,
                max_tokens=800,  # Increased for more natural responses
                top_p=0.9,
                stream=False
            )
            
            # Clean response from any markdown formatting
            response = completion.choices[0].message.content
            return self._clean_markdown_formatting(response)
            
        except Exception as e:
            return f"I apologize, but I'm experiencing some technical difficulties. Please try again later. Error: {str(e)}"

    async def get_project_insights(self, project_data: Dict[str, Any]) -> str:
        """
        Analyze project data and provide insights
        
        Args:
            project_data: Dictionary containing project information
            
        Returns:
            AI-generated project insights and recommendations
        """
        try:
            # Create a prompt based on project data
            prompt = f"""
            Analyze this project and provide insights and recommendations:
            
            Project Details:
            - Title: {project_data.get('title', 'Not specified')}
            - Description: {project_data.get('description', 'Not specified')}
            - Timeline: {project_data.get('timeline', 'Not specified')}
            - Budget: {project_data.get('budget', 'Not specified')}
            - Client Type: {project_data.get('client_type', 'Not specified')}
            - Project Complexity: {project_data.get('complexity', 'Not specified')}
            - Start Date: {project_data.get('start_date', 'Not specified')}
            
            Please provide:
            1. Risk assessment
            2. Timeline feasibility
            3. Budget considerations
            4. Key success factors
            5. Potential challenges and mitigation strategies
            """
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1200,
                top_p=0.9,
                stream=False
            )
            
            # Clean response from any markdown formatting
            response = completion.choices[0].message.content
            return self._clean_markdown_formatting(response)
            
        except Exception as e:
            return f"Unable to analyze project data at the moment. Error: {str(e)}"

    async def get_quick_advice(self, question_type: str) -> str:
        """
        Get quick advice for common project management scenarios
        
        Args:
            question_type: Type of quick advice needed
            
        Returns:
            Targeted advice for the specific scenario
        """
        quick_prompts = {
            "prioritization": "How should I prioritize multiple urgent projects as a freelancer?",
            "estimation": "What's the best way to estimate project timelines accurately?",
            "communication": "How can I improve client communication throughout a project?",
            "scope_creep": "What are effective strategies for managing project scope creep?",
            "deadlines": "How do I handle tight or unrealistic project deadlines?",
            "pricing": "How should I price my freelance projects for profitability?"
        }
        
        prompt = quick_prompts.get(question_type, question_type)
        
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,
                max_tokens=600,  # Increased for better responses
                top_p=0.9,
                stream=False
            )
            
            # Clean response from any markdown formatting
            response = completion.choices[0].message.content
            return self._clean_markdown_formatting(response)
            
        except Exception as e:
            return f"Unable to provide quick advice at the moment. Error: {str(e)}"

    def _clean_markdown_formatting(self, text: str) -> str:
        """
        Remove markdown formatting from AI response
        
        Args:
            text: Raw AI response that might contain markdown
            
        Returns:
            Clean text without markdown formatting
        """
        import re
        
        # Remove markdown formatting
        # Remove bold (**text** or __text__)
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'__(.*?)__', r'\1', text)
        
        # Remove italic (*text* or _text_)
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        text = re.sub(r'_(.*?)_', r'\1', text)
        
        # Remove headers (# ## ###)
        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        
        # Remove bullet points (- * +)
        text = re.sub(r'^[-*+]\s+', '', text, flags=re.MULTILINE)
        
        # Remove numbered lists (1. 2. etc) - keep the number but remove the dot
        text = re.sub(r'^(\d+)\.\s+', r'\1. ', text, flags=re.MULTILINE)
        
        # Remove code blocks (``` or `)
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        text = re.sub(r'`(.*?)`', r'\1', text)
        
        # Remove links [text](url)
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        
        # Remove excessive line breaks and clean up
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()
        
        return text

# Singleton instance
groq_client = GroqLlamaClient()
