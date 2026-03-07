# Windows Native Setup

This repo has been validated to run natively on Windows.

## What the project expects

- Node.js 20+
- npm 10+
- Cloudflare Wrangler available through the workspace dependencies

`wrangler` is already declared in both workspaces, so project commands do not depend on a global install.

Use:

```powershell
npx wrangler --version
npx wrangler whoami
```

or the existing scripts:

```powershell
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
```

## Recommended native workflow

1. Open PowerShell in `C:\Users\Duncan\Desktop\addreams`.
2. Verify Windows-native Node and npm:

```powershell
node -v
npm -v
```

3. Install dependencies from Windows:

```powershell
npm install
```

4. Verify Wrangler auth on Windows:

```powershell
npx wrangler whoami
```

If interactive login is needed:

```powershell
npx wrangler login
```

If you prefer token-based auth for the current shell, load `CLOUDFLARE_API_TOKEN` from `.env.cloudflare.local` before running deploy commands.

## Local development

Run both apps:

```powershell
npm run dev
```

Expected local services:
- Frontend Vite server on `http://127.0.0.1:5173` by default. If the port is busy, Vite will move to the next free port.
- Backend Worker on `http://127.0.0.1:8787`

## If WSL previously installed dependencies

If commands fail because native binaries were installed under WSL, remove the existing install and reinstall from Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

Typical signs of a bad cross-environment install are missing executables, native package load failures, or Linux-only binaries inside a Windows shell.
