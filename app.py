from flask import Flask, request, jsonify
import os
from src import interpreter

app = Flask(__name__)

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'result': None, 'error': 'No code provided'}), 400

    code = data['code']
    
    # Use the interpreter wrapper
    response = interpreter.run(code)
    
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
