GitHub Actions CI/CD for Lucifer Bot

This workflow builds a Docker image and publishes it to GitHub Container Registry (GHCR). Optionally it triggers a Render deploy if you provide Render credentials as GitHub Secrets.

What the workflow does
- On push to branch dev/structure-pro (or manual dispatch):
  - Checkout repository
  - Build Docker image using buildx
  - Push image tags to ghcr.io/<your-org>/lucifer-bot:latest and :<commit-sha>
  - If RENDER_API_KEY and RENDER_SERVICE_ID are present in Secrets, call Render API to create a new deploy

Required GitHub Secrets
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_DATABASE_URL
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- SESSION_SECRET (a strong random string)
- (Optional) RENDER_API_KEY — Render service API key
- (Optional) RENDER_SERVICE_ID — Render service id (looks like rshrv_...)

How to add secrets
1. Go to your repository on GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret
2. Add each secret name and value from the list above

Render setup (optional)
1. Create an account on https://render.com and connect your GitHub repo
2. Create a new Web Service (Docker) and note the Service ID from the Render dashboard (or API)
3. Create an API Key on Render (Account -> API Keys)
4. Add RENDER_API_KEY and RENDER_SERVICE_ID to your GitHub Secrets

Notes & Security
- Revoke any tokens (ghp_...) you shared publicly immediately.
- Do not post secrets in chat. Use GitHub Secrets to store credentials.
- The workflow uses the repository's GITHUB_TOKEN to authenticate with GHCR. If you run into permission errors for packages, create a personal access token with "write:packages" and add it as GHCR_PAT in Secrets and change the login step accordingly.

Triggering
- Push to dev/structure-pro to trigger automatically.
- Or run the workflow manually from the Actions tab (Workflow dispatch).
