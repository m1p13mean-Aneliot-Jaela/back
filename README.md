# M1P13 MEAN Stack - Backend API

Express.js REST API with modular architecture and MongoDB.

## Features

- Modular architecture by domain (ready for your modules)
- MongoDB with Mongoose (optional)
- Input validation
- Error handling
- Logging with Winston
- Security with Helmet
- CORS enabled

## Prerequisites

- Node.js (v18+)
- MongoDB (optional, for database features)
- Docker & Docker Compose (optional, for containerized development)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## Running the Application

### Local Development

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Docker Development

Build and run with Docker Compose (includes MongoDB):
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Development mode with hot reload:
```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build
```

### Docker Production

Build production image:
```bash
docker build -t m1p13mean-backend .
```

Run production container:
```bash
docker run -d -p 3000:3000 --env-file .env --name m1p13mean-backend m1p13mean-backend
```

## Testing

```bash
npm test
```

## Project Structure

```
src/
├── app.js                 # Express app configuration
├── server.js              # HTTP server bootstrap
├── config/                # Configuration files
├── modules/               # Business domain modules
├── middlewares/           # Express middlewares
├── shared/                # Shared utilities
├── tests/                 # Test files
└── docs/                  # Documentation
```

## API Endpoints

### Health Check
- GET `/health` - Server health check

### Your Modules
Add your API endpoints in the `src/modules/` directory following the modular architecture pattern.
