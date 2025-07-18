import json

def handler(request):
    # Handle CORS preflight requests
    if request.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
    
    # Extract userId from path parameters
    user_id = request.get('path', {}).get('userId', 'unknown')
    
    # For now, return empty projects list since we don't have database connection
    # In a real implementation, this would fetch from Supabase using the user_id
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps({
            'projects': [],
            'count': 0,
            'user_id': user_id
        })
    } 