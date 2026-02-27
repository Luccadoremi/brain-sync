# Frontend startup script
cd frontend
npm install > /dev/null 2>&1
nohup npm run dev -- --host 0.0.0.0 --port 3000 >/tmp/brain-sync-frontend.log 2>&1 &
