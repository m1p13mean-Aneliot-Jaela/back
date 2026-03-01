# M1P13 MEAN Stack - Backend API

Express.js REST API with modular architecture and MongoDB.

## Features

- Modular architecture by domain
- **JWT Authentication** (JSON Web Tokens)
- User management with role-based access control (admin, shop, buyer)
- MongoDB with Mongoose ODM
- Input validation with express-validator
- Comprehensive error handling
- Logging with Winston
- Security with Helmet
- CORS enabled
- Password hashing with bcrypt

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
├── app.js                     # Express app configuration
├── server.js                  # HTTP server bootstrap
├── config/                    # Configuration files
│   ├── env.js                # Environment variables
│   ├── database.js           # Database connection
│   └── logger.js             # Winston logger setup
├── modules/                   # Business domain modules
│   ├── auth/                 # Authentication module
│   │   ├── auth.routes.js   # Auth routes
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   └── user/                 # User management module
│       ├── user.routes.js   # User routes
│       ├── user.controller.js
│       ├── user.service.js
│       ├── user.repository.js
│       └── user.model.js
├── middlewares/               # Express middlewares
│   ├── auth.middleware.js    # JWT authentication & authorization
│   ├── validation.middleware.js
│   └── error.middleware.js
├── shared/                    # Shared utilities
│   ├── constants/            # App constants
│   ├── errors/               # Custom error classes
│   ├── utils/                # Utility functions
│   └── validators/           # Validation schemas
├── docs/                      # API documentation
│   ├── api-overview.md       # API overview
│   ├── auth.api.md          # Authentication API docs
│   └── user.api.md          # User API docs
└── tests/                     # Test files
```

## API Documentation

The API uses **JWT (JSON Web Tokens)** for authentication.

### Quick Links

- **[API Overview](src/docs/api-overview.md)** - Complete API documentation with response formats and examples
- **[Authentication API](src/docs/auth.api.md)** - Signup, login, logout, and token management
- **[User API](src/docs/user.api.md)** - User profile and administration endpoints

### Available Endpoints

#### Health Check
- `GET /health` - Server health check

#### Authentication Module (`/api/auth`)
- `POST /api/auth/signup` - Register new buyer account
- `POST /api/auth/login` - Login (all user types)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/validate` - Validate token

#### User Module (`/api/users`)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `PUT /api/users/:id/status` - Update user status (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)

### User Types

- `admin` - System administrators
- `shop` - Shop managers/staff
- `buyer` - Regular customers (can self-register)

### Database Setup

Run the database setup script to create collections with validators and indexes:

```bash
npm run setup:db
```
## Render Deployment

The application is configured for easy deployment on Render.

### Quick Deploy

1. Push your code to GitHub/GitLab
2. Go to [Render Dashboard](https://render.com/dashboard)
3. Click "New +" → "Web Service"
4. Select the `back` directory as root
5. Set environment variables (see RENDER_DEPLOYMENT.md)
6. Deploy

### Configuration Files

- `render.yaml` - Render service configuration (Infrastructure as Code)
- `.env.render` - Example production environment variables
- `RENDER_DEPLOYMENT.md` - Comprehensive deployment guide

### Required Environment Variables

Set these in Render Dashboard → Environment:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secure random string (use Render's Generate button)
- `JWT_REFRESH_SECRET` - Another secure random string
- `CORS_ORIGIN` - Your frontend URL (e.g., https://your-app.vercel.app)

For detailed deployment instructions, see **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**.

### Health Checks

The application includes a health check endpoint at `/health` for monitoring:
- **Endpoint**: `GET /health`
- **Response**: `200 OK` with server status