from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "message": "API is working!",
        "method": "Flask WSGI",
        "environment": {
            "groq_key_set": bool(os.getenv("GROQ_API_KEY")),
            "supabase_url_set": bool(os.getenv("VITE_SUPABASE_URL")),
            "supabase_key_set": bool(os.getenv("VITE_SUPABASE_ANON_KEY"))
        }
    })

if __name__ == '__main__':
    app.run(debug=True) 