# UPLim Compiler API

🧠 UPLim — це проста, безпечна та кросплатформенна мова для всіх типів застосунків.

🚀 Деплой: https://uplim-lang.onrender.com
👨‍💻 Автор: @Hulicchuk
📄 Ліцензія: MIT

## UPLim API Service

Deployment instructions for the UPLim language interpreter API on Render.

## Local Development

1.  **Install Dependencies**:

    ```bash
    npm install
    pip install -r requirements.txt
    ```

2.  **Run Server**:

    ```bash
    python3 app.py
    ```

3.  **Test**:
    - Run the automated suite (uses the CLI via `npx tsx`):
      ```bash
      npm test
      ```
    - Or invoke the API directly:
      ```bash
      curl -X POST -H "Content-Type: application/json" \
           -d '{"code": "say 1 + 2"}' \
           http://localhost:10000/run
      ```

## Deploy to Render

### Option 1: Using Blueprints (Recommended)

1.  Push changes to GitHub.
2.  Go to [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Blueprint**.
4.  Connect your repository `uplim-lang`.
5.  Render will auto-detect `render.yaml`.
6.  Click **Apply**.

### Option 2: Manual Web Service

1.  Click **New +** -> **Web Service**.
2.  Connect your repository.
3.  **IMPORTANT**: In the configuration screen:
    - **Runtime**: Select **Docker** (Do NOT select Python).
    - If you select Python, the app will crash because it needs Node.js.
4.  Click **Deploy**.

The service will be available at `https://your-service-name.onrender.com`.
Endpoint: `POST /run`
