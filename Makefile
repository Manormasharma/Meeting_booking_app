# Makefile for Meeting Booking App

# Build all services
docker-build:
	docker-compose build

# Start all services
docker-up:
	docker-compose up -d

# Stop all services
docker-down:
	docker-compose down

# Install dependencies for all services
install:
	cd backend && npm install
	cd ../frontend && npm install
	cd ../ai-service && npm install

# Run backend only
backend:
	cd backend && npm start

# Run frontend only
frontend:
	cd frontend && npm start

# Run ai-service only
ai-service:
	cd ai-service && npm start

.PHONY: docker-build docker-up docker-down install backend frontend ai-service
