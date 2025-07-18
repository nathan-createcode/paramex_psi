import os
from groq import Groq
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GroqLlamaClient:
    def __init__(self, performance_mode="balanced"):
        """
        Initialize Groq client with Meta Llama models
        
        Args:
            performance_mode: "fast", "balanced", or "quality"
        """
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = Groq(api_key=self.api_key)
        
        # Configure model and parameters based on performance mode
        if performance_mode == "fast":
            self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
            self.max_tokens = 300
            self.temperature = 0.6
            self.top_p = 0.7
            self.history_length = 2
        elif performance_mode == "quality":
            self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
            self.max_tokens = 800
            self.temperature = 0.8
            self.top_p = 0.9
            self.history_length = 6
        else:  # balanced (default)
            self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
            self.max_tokens = 500
            self.temperature = 0.7
            self.top_p = 0.8
            self.history_length = 4
        
        # System prompt for project advisory
        self.system_prompt = """You are a helpful AI Project Advisor who can help with freelance project management topics. 

Your approach:
- ALWAYS respond directly to what the user asks
- When user asks about their projects, workload, or deadlines, look for [USER'S PROJECT DATA] section in their message
- Be conversational and natural in your responses
- Use the provided project data to give specific, personalized advice
- If no project data is provided, give general advice
- If they ask general questions, give general answers

Your capabilities:
- Project planning and time management advice
- Client relationship guidance  
- Budget and resource planning
- General business and work advice
- Analysis of user's actual project portfolio when data is provided

When project data is provided in [USER'S PROJECT DATA] section:
- You CAN access and analyze their actual projects
- Reference specific projects by name when relevant
- Give personalized recommendations based on their actual workload
- Identify overdue or urgent projects
- Help prioritize based on deadlines and payments
- Provide specific actionable advice

Communication style:
- Listen to what the user actually wants to know
- Answer their specific question directly
- Be helpful and friendly
- Use their actual project data when available
- Give concrete, actionable advice
- Match the user's tone and topic focus

IMPORTANT: If you see [USER'S PROJECT DATA] in the message, you DO have access to their actual project information and should use it to provide personalized advice."""

    def generate_response(self, prompt: str, system_prompt: str = None, max_tokens: int = None, temperature: float = None) -> str:
        """
        Generate AI response using Groq API
        
        Args:
            prompt: User's input message
            system_prompt: Optional system prompt override
            max_tokens: Optional max tokens override
            temperature: Optional temperature override
            
        Returns:
            AI-generated response
        """
        try:
            messages = [
                {"role": "system", "content": system_prompt or self.system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
                top_p=self.top_p,
                stream=False
            )
            
            response = completion.choices[0].message.content
            return self._clean_markdown_formatting(response)
            
        except Exception as e:
            return f"I apologize, but I'm experiencing some technical difficulties. Please try again later. Error: {str(e)}"

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
            
            # Add conversation history if provided (reduced context for speed)
            if conversation_history:
                for msg in conversation_history[-self.history_length:]:
                    role = "user" if msg["type"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Call Groq API with optimized parameters
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=self.top_p,
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
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=self.top_p,
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
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=self.top_p,
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