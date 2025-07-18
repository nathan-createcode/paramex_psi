import json

def handler(request):
    # Handle CORS preflight requests
    if request.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    
    user_email = body.get('user_email', 'unknown@example.com')
    user_name = body.get('user_name', 'User')
    
    # Simulate email test (in real implementation, this would send an actual email)
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps({
            'success': True,
            'message': f'Test email would be sent to {user_email} for {user_name}',
            'status': 'Email service simulation successful'
        })
    } 