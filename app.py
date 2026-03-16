from flask import Flask, request, jsonify
from src import interpreter
import os

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'online',
        'service': 'UPLim Interpreter API',
        'version': '0.1.0'
    })

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'result': None, 'error': 'No code provided'}), 400

    code = data['code']
    
    # Use the interpreter wrapper
    response = interpreter.run(code)
    
    return jsonify(response)

@app.route('/compile', methods=['POST'])
def compile_code():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'result': None, 'error': 'No code provided'}), 400

    code = data['code']
    response = interpreter.compile(code)
    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
