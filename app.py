from flask import Flask, request, jsonify
import subprocess
import os
import tempfile

app = Flask(__name__)

# Path to the TypeScript CLI
# In Docker, we will setup the path correctly.
# Locally, it's relative to CWD.
BASE_DIR = os.getcwd()
CLI_PATH = os.path.join(BASE_DIR, 'src', 'cli.ts')

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'result': None, 'error': 'No code provided'}), 400

    code = data['code']
    
    # Create temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.upl', delete=False) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        # Execute using npx tsx
        # We assume Node/npm/tsx are installed in the environment
        result = subprocess.run(
            ['npx', 'tsx', CLI_PATH, 'run', tmp_path],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        
        stdout = result.stdout
        stderr = result.stderr
        
        # If exit code is not 0, treating as error/exception
        if result.returncode != 0:
             return jsonify({
                'result': stdout, 
                'error': stderr or "Unknown runtime error"
            })

        return jsonify({'result': stdout, 'error': None})

    except Exception as e:
        return jsonify({'result': None, 'error': str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
