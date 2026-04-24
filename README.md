# Meeting Room Booking Application

## Features
- Dynamic meeting room management (scalable)
- Book, view, and manage rooms
- Strict conflict detection for bookings
- Admin panel for room management
- AI-powered booking assistant (Ollama/ChatGPT)
- Role-based access (user/admin)
- Responsive UI (React + MUI)
- Dockerized for local development

## Folder Structure
- `/client` - React frontend (MUI, PWA-ready)
- `/server` - Node.js backend (Express, MongoDB)
- `/ai-service` - AI integration (Ollama/ChatGPT)

## Quick Start

1. Copy `.env.example` to `.env` in `server` and `ai-service`, fill secrets.
2. Run `docker-compose up --build` from the root folder.
3. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:6000
   - MongoDB: mongodb://localhost:27017/meeting_booking

## Sample API Requests

- Get rooms: `GET /api/rooms`
- Book room: `POST /api/bookings`
- AI booking: `POST /api/ai-bookings` (body: `{ input: "Book a room for 5 people tomorrow at 3 PM for 1 hour" }`)

## Dev Notes
- Use real MongoDB, not in-memory
- All code is modular and production-ready
- See each folder for more details
