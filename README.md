# OmniGPT

Full-stack AI chat assistant powered by Google Gemini (`@google/genai`), React, Vite, and Express / Netlify Functions.

## Deploy to Netlify

1. Unzip `omnigpt-source.zip` (or push this repository to GitHub/GitLab/Bitbucket).
2. In **Netlify**, click **Add new site** -> **Import an existing project** (or deploy via Netlify CLI: `npm install && npx netlify deploy --prod`).
3. Netlify automatically detects `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. Open **Site configuration -> Environment variables** and add:
   - `GEMINI_API_KEY` = your Google AI Studio Gemini API key (`https://aistudio.google.com/apikey`)
5. Trigger a deploy. All `/api/*` requests route seamlessly to `netlify/functions/api.ts`.

## Local Development

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

Open `http://localhost:3000`.
