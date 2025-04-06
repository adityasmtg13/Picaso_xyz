from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import sqlite3
from datetime import datetime

app = Flask(__name__)

CORS(app)  # Enable CORS to allow frontend access

# Configure Gemini
genai.configure(api_key="AIzaSyBwWG5ueiTzGSXkd_9u8SO1Wk0CYVzIZRw")
model = genai.GenerativeModel('gemini-2.0-flash')

# Database setup
def init_db():
    conn = sqlite3.connect('picaso.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS interactions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_input TEXT,
                  bot_response TEXT,
                  timestamp DATETIME)''')
    conn.commit()
    conn.close()

init_db()

def clean_response(text):
    """Remove markdown symbols from the response"""
    return text.replace('', '').replace('```', '').replace("'''", "").strip()

def save_interaction(user_input, bot_response):
    conn = sqlite3.connect('picaso.db')
    c = conn.cursor()
    c.execute("INSERT INTO interactions (user_input, bot_response, timestamp) VALUES (?, ?, ?)",
              (user_input, bot_response, datetime.now()))
    conn.commit()
    conn.close()

@app.route('/api/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '').strip()
    
    # Handle empty input
    if not user_input:
        return jsonify({'response': "Please enter a message."})
    
    # Handle questions about capabilities
    if any(phrase in user_input.lower() for phrase in ["what can you do", "what do you do", "your capabilities", "help me with"]):
        response = "I'm a friendly assistant that can help with general knowledge, learning topics, coding questions, education subjects, and even some life situations. What would you like help with?"
        save_interaction(user_input, response)
        return jsonify({'response': response})
    
    # Handle identity questions
    if any(phrase in user_input.lower() for phrase in ["your name", "who are you", "what's your name"]):
        response = "I'm PICASO, your helpful AI assistant! How can I assist you today?"
        save_interaction(user_input, response)
        return jsonify({'response': response})
    
    # Get response from Gemini
    if user_input:
        try:
            response = model.generate_content(user_input)
            cleaned_response = clean_response(response.text)
            save_interaction(user_input, cleaned_response)
            return jsonify({'response': cleaned_response})
        except Exception as e:
            print(f"Error: {e}")
            error_msg = "Sorry, I'm having trouble responding right now. Please try again."
            save_interaction(user_input, error_msg)
            return jsonify({'response': error_msg})

@app.route('/api/history', methods=['GET'])
def get_history():
    conn = sqlite3.connect('picaso.db')
    c = conn.cursor()
    c.execute("SELECT user_input, bot_response, timestamp FROM interactions ORDER BY timestamp DESC LIMIT 10")
    history = [{'user': row[0], 'bot': row[1], 'time': row[2]} for row in c.fetchall()]
    conn.close()
    return jsonify(history)

if __name__ == '__main__':
    app.run(host='localhost', port=3000, debug=True)