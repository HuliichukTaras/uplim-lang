import subprocess
import os
import tempfile
import sys

# Define path to the TypeScript CLI
# Assuming this script is in src/, and cli.ts is in src/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLI_PATH = os.path.join(BASE_DIR, 'src', 'cli.ts')

def run(code: str):
    """
    Executes UPLim code by invoking the TypeScript CLI.
    Returns a dictionary: {'result': stdout, 'error': stderr or error_message}
    """
    tmp_path = None
    try:
        # Create a temporary file with the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.upl', delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        # Execute using npx tsx
        # We assume Node/npm/tsx are installed in the environment
        cmd = ['npx', 'tsx', CLI_PATH, 'run', tmp_path]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )

        # Remove temp file immediately after run
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            tmp_path = None

        if result.returncode != 0:
            return {
                'result': result.stdout,
                'error': result.stderr or "Unknown runtime error"
            }
        
        return {
            'result': result.stdout,
            'error': None
        }

    except Exception as e:
        return {
            'result': None,
            'error': str(e)
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

def compile(code: str):
    """
    Compiles UPLim code to JavaScript using the TypeScript CLI.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.upl', delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        cmd = ['npx', 'tsx', CLI_PATH, 'compile', tmp_path, '--stdout']
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )

        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            tmp_path = None

        if result.returncode != 0:
            return {
                'result': None,
                'error': result.stderr or "Compilation failed"
            }
        
        return {
            'result': result.stdout,
            'error': None
        }

    except Exception as e:
        return {
            'result': None,
            'error': str(e)
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
