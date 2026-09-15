# Meera Desktop Frontend (TypeScript)

This is the new premium desktop frontend stack for Meera:
- Frontend language: **TypeScript**
- UI: **React + Vite**
- Desktop shell: **Electron**

## Why this stack
TypeScript is the strongest frontend language for building a Copilot-style UI quickly with quality, tooling, and maintainability.

## Run
1. Start Meera API in one terminal:
```powershell
cd Agent
python Meera.py --api --port 8000
```

2. Start frontend desktop app in another terminal:
```powershell
cd Agent\desktop_frontend
npm install
npm run dev
```

## Build
```powershell
npm run build
```

## API endpoint
The UI calls:
- `http://127.0.0.1:8000/api/chat`

Update `API_URL` in `src/App.tsx` if needed.
