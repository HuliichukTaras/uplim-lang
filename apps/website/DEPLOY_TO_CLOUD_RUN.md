# Deploy to Google Cloud Run

Since you do not have the `gcloud` CLI or `docker` installed locally, this guide will help you set up and deploy your application directly from the source code.

## Prerequisites

1.  **Google Cloud Project**: You need a Google Cloud Project with billing enabled.
2.  **Google Cloud CLI**: You need to install the `gcloud` command-line tool.

### Install gcloud CLI

Follow the official documentation to install the CLI for your OS:
[https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

After installation, run:

```bash
gcloud init
```

This will guide you through logging in and selecting your project.

## Deployment Steps

Navigate to the `website` directory in your terminal:

```bash
cd website
```

### Option 1: One-Command Deployment (Recommended)

Google Cloud Run can build your container remotely using the `Dockerfile` we just created.

Run the following command:

```bash
gcloud run deploy fantikx-web \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

- Replace `fantikx-web` with your desired service name.
- Replace `us-central1` with your preferred region (e.g., `europe-west1` for Belgium).
- The `--allow-unauthenticated` flag makes the website publicly accessible.

**When prompted:**

- If asked to enable the **Artifact Registry API** or **Cloud Build API**, say **yes (y)**.

### Option 2: Manual Build & Deploy

If the command above fails, you can try separate build and deploy steps.

1.  **Build the image using Cloud Build**:

    ```bash
    gcloud builds submit --tag gcr.io/PROJECT_ID/fantikx-web .
    ```

    _(Replace `PROJECT_ID` with your actual project ID)_

2.  **Deploy the image**:
    ```bash
    gcloud run deploy fantikx-web \
      --image gcr.io/PROJECT_ID/fantikx-web \
      --region us-central1 \
      --allow-unauthenticated
    ```

## Important Notes

- **Environment Variables**: If your app needs environment variables (e.g., Supabase keys, Stripe keys), you must set them in Cloud Run.
  - You can pass them in the deploy command: `--set-env-vars KEY=VALUE,KEY2=VALUE2`
  - Or set them in the Google Cloud Console UI after deployment.
- **Project Structure**: This command **must** be run from inside the `website` folder where the `Dockerfile` is located.
