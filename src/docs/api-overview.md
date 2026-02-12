# API Documentation

## Overview

This is a RESTful API built with Express.js and MongoDB, using JWT for authentication. The API follows a modular architecture organized by business domains.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses **JWT (JSON Web Tokens)** for authentication. Protected endpoints require an access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: Expires in 24 hours (configurable)
- **Refresh Token**: Expires in 7 days (configurable)
- Use the refresh endpoint to get new tokens without re-authenticating

## Available Modules

### 1. Authentication Module
Handles user registration, login, and token management.

- **Base Path**: `/api/auth`
- **Documentation**: [Authentication API](./auth.api.md)

**Key Endpoints**:
- `POST /api/auth/signup` - Register new buyer account
- `POST /api/auth/login` - Login (all user types)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/validate` - Validate token

### 2. User Module
Manages user profiles and administration.

- **Base Path**: `/api/users`
- **Documentation**: [User API](./user.api.md)

**Key Endpoints**:
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `PUT /api/users/:id/status` - Update user status (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)

## User Types

The system supports four user types with different permissions:

| User Type | Description | Can Self-Register | Access Level |
|-----------|-------------|-------------------|--------------|
| `admin` | System administrators | ❌ | Full access to all endpoints |
| `brand` | Brand managers/owners | ❌ | Manage their brands and shops |
| `shop` | Shop managers/staff | ❌ | Manage their shop operations |
| `buyer` | Regular customers | ✅ | Access customer features |

**Note**: Only `buyer` accounts can be created through the signup endpoint. Other user types must be created by administrators.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* optional validation errors */ ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

## Error Handling

All errors follow a consistent format:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authentication token is required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

## Rate Limiting

*(To be implemented)*

## Versioning

Current API version: **v1** (no version prefix in URL yet)

Future versions may use: `/api/v2/...`

## Testing the API

### Using cURL

**Signup**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get Profile** (with token):
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the API collection (to be created)
2. Set the base URL: `http://localhost:3000/api`
3. For protected endpoints, add the token to the Authorization header

## Environment Configuration

Required environment variables for API functionality:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/m1p13mean

# JWT
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:4200
```

## Database Setup

Before using the API, run the database setup script to create collections with validators and indexes:

```bash
npm run setup:db
```

## Support

For questions or issues:
- Check the module-specific documentation
- Review the error messages and status codes
- Contact the development team

## Changelog

### v1.0.0 (Current)
- Initial API release
- Authentication module (signup, login, logout, token refresh)
- User module (profile management, user administration)
- JWT authentication implementation
