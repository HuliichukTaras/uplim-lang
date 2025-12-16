# UPLim Engine API (Render Deployment)

This directory contains the configuration to deploy the UPLim Engine as a **Python Flask** service on Render, which wraps the underlying **TypeScript CLI**.

## Structure

- `app.py`: Flask server with `POST /run` endpoint. It calls `src/cli.ts` via subprocess.
- `Dockerfile.render`: A custom hybrid image installing both **Python 3.11** and **Node.js 20**.
- `render.yaml`: Infrastructure-as-code configuration for Render.

## Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Run Server**:

   ```bash
   python3 app.py
   ```

3. **Test Endpoint**:
   ```bash
   curl -X POST http://localhost:10000/run \
     -H "Content-Type: application/json" \
     -d '{"code": "let x = 10; print(x)"}'
   ```

## Deploy to Render

1. Push this repository to GitHub/GitLab.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Connect your repository.
4. Select **Docker** as the environment.
5. **Important**: Specify `Dockerfile.render` as the Dockerfile path (if Render allows UI config, otherwise `render.yaml` handles it via Blueprints).
   - _Better approach_: Use **Blueprints**. Go to Blueprints, click **New Blueprint Instance**, and select this repo. It will detect `render.yaml`.

## API Contract

**POST /run**

Request:

```json
{
  "code": "print(1 + 2)"
}
```

Response (Success):

```json
{
  "result": "3\n",
  "error": null
}
```

Response (Error):

```json
{
  "result": "...",
  "error": "Parse Error: ..."
}
```
