# Meeting Room Booking Application

Production-style monorepo for dynamic meeting room booking with AI-assisted natural language booking.

## Folder Structure

```text
.
├── frontend/      # React + MUI PWA client
├── backend/       # Express API, Mongoose models, auth, booking logic
├── ai-service/    # Ollama-first parser with OpenAI fallback
├── docker-compose.yml
└── Makefile
```

## Features

- Dynamic rooms, scalable beyond the initial seed data
- User/admin role-based access with JWT
- Admin room create, update, enable/disable, delete
- Strict overlap detection using `existing.start < new.end AND existing.end > new.start`
- Room booking validation for capacity, enabled state, and valid time windows
- AI booking endpoint that parses natural language and suggests the smallest available fitting room
- MongoDB booking index: `{ room: 1, start_time: 1, end_time: 1 }`
- React + MUI responsive UI with a simple PWA manifest and service worker
- Docker setup for MongoDB, backend, frontend, AI service, and Ollama

## Local Setup

1. Install dependencies:

```bash
make install
```

2. Create env files:

```bash
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
```

3. Start everything with Docker:

```bash
docker-compose up --build
```

4. Optional: pull an Ollama model:

```bash
docker exec -it meeting_booking_app-ollama-1 ollama pull llama3.1
```

5. Open the app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- AI service: http://localhost:6000/api
- MongoDB: mongodb://localhost:27017/meeting_booking

## Seed Data

```bash
cd backend
npm run dev
node seedRooms.js
node seedAdminUser.js
```

Default seed scripts create initial rooms and an admin user. Check the script files before using them in shared environments.

## Sample API Requests

Login:

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Get rooms:

```bash
curl http://localhost:5000/api/rooms
```

Create a room as admin:

```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Board Room","capacity":12,"enabled":true}'
```

Create a booking:

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room":"ROOM_ID","start_time":"2026-04-25T09:30:00.000Z","end_time":"2026-04-25T10:30:00.000Z","people":5}'
```

AI booking suggestion:

```bash
curl -X POST http://localhost:5000/api/ai-bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"Book a room for 5 people tomorrow at 3 PM for 1 hour"}'
```

## Notes

- The frontend calls the backend for AI booking. The backend calls `ai-service`, then applies room capacity and availability logic.
- Ollama is attempted first. If it fails and `OPENAI_API_KEY` is configured, the AI service falls back to OpenAI.
- For local non-Docker development, run MongoDB and Ollama separately, then start each app with `npm run dev` or `npm start`.
