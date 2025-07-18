import json
import os

def handler(request):
    # Handle CORS preflight requests
    if request.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
    
    # Parse request body
    try:
        if request.get('body'):
            body = json.loads(request['body'])
        else:
            body = {}
    except json.JSONDecodeError:
        body = {}
    
    message = body.get('message', 'Hello')
    user_id = body.get('user_id', 'unknown')
    
    # Generate simple AI response
    message_lower = message.lower()
    
    if "hello" in message_lower or "hi" in message_lower:
        response = "Hello! I'm your AI Project Advisor. How can I help you with your freelance projects today?"
    elif "project" in message_lower and "priority" in message_lower:
        response = "For project prioritization, I recommend focusing on: 1) Deadline urgency, 2) Payment amount, 3) Project complexity. Consider your current workload and choose projects that align with your skills."
    elif "timeline" in message_lower or "deadline" in message_lower:
        response = "For project timelines, always add 20-30% buffer time for unexpected issues. Break large projects into smaller milestones and communicate progress regularly with clients."
    elif "client" in message_lower:
        response = "Client management tips: Set clear expectations upfront, communicate regularly, document all changes, and don't be afraid to ask questions. Good communication prevents most project issues."
    elif "price" in message_lower or "pricing" in message_lower:
        response = "For pricing, consider: your expertise level, market rates, project complexity, timeline, and client budget. Don't undervalue your work - quality deserves fair compensation."
    else:
        response = "I'm here to help with your freelance project management! Ask me about project prioritization, client communication, timeline planning, pricing strategies, or any other project-related questions."
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps({
            'response': response,
            'status': 'success'
        })
    } 