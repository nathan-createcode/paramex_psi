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
    
    # Extract dashboard data
    dashboard_data = body.get('dashboard_data', {})
    total_projects = dashboard_data.get('totalProjects', 0)
    completed_projects = dashboard_data.get('completedProjects', 0)
    total_earnings = dashboard_data.get('totalEarnings', 0)
    
    # Generate summary
    if total_projects == 0:
        summary = "Welcome to your project dashboard! You're just getting started - time to create your first project and begin your freelance journey."
    else:
        summary = f"You have {total_projects} projects in your portfolio"
        
        if completed_projects > 0:
            completion_rate = (completed_projects / total_projects) * 100
            summary += f" with {completed_projects} completed ({completion_rate:.0f}% completion rate)"
        
        if total_earnings > 0:
            summary += f". Your total earnings are ${total_earnings:,.0f}"
        
        summary += ". Keep up the great work!"
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps({
            'summary': summary
        })
    } 