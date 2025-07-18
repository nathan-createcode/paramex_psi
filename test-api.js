// Simple test script to verify API endpoints
const testEndpoints = async () => {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    try {
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    // Test hello endpoint
    try {
        const helloResponse = await fetch(`${baseUrl}/api/hello`);
        const helloData = await helloResponse.json();
        console.log('✅ Hello endpoint:', helloData);
    } catch (error) {
        console.log('❌ Hello endpoint failed:', error.message);
    }
    
    // Test chat endpoint
    try {
        const chatResponse = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Hello AI!',
                user_id: 'test'
            })
        });
        const chatData = await chatResponse.json();
        console.log('✅ Chat endpoint:', chatData);
    } catch (error) {
        console.log('❌ Chat endpoint failed:', error.message);
    }
};

// Run tests
testEndpoints(); 