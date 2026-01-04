import requests
import sys
import json

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "codellama:13b"

def query_ollama(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """
    Sends a prompt to the local Ollama instance and returns the generated response.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        print(f"🤖 Asking {model}...", file=sys.stderr)
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")
    except requests.exceptions.ConnectionError:
        return "Error: Could not connect to Ollama. Is it running at http://localhost:11434?"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ollama_client.py <prompt> [model]")
        print("Example: python ollama_client.py 'Write a factorial function in UPLim'")
        sys.exit(1)
    
    user_prompt = sys.argv[1]
    user_model = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MODEL
    
    result = query_ollama(user_prompt, user_model)
    print("\n" + result)
