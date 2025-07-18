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
    
    # Extract data from request
    current_workload = body.get('current_workload', 0)
    completion_rate = body.get('completion_rate', 0)
    
    # Simple analysis based on workload
    if current_workload < 2:
        recommendation = "proceed"
        confidence = 90
        reasoning = f"With only {current_workload} active projects, you have good capacity for new work."
    elif current_workload < 4:
        recommendation = "proceed"
        confidence = 75
        reasoning = f"With {current_workload} active projects, you can manage another project with careful planning."
    else:
        recommendation = "defer"
        confidence = 80
        reasoning = f"With {current_workload} active projects, consider completing some before taking on new work."
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps({
            'decision': {
                'recommendation': recommendation,
                'confidence': confidence,
                'reasoning': reasoning
            }
        })
    } 