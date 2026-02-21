# Authentication API

Base URL: `/api/auth`

## Overview

The Authentication API handles user registration (signup), login, token management, and logout functionality. It uses **JWT (JSON Web Tokens)** for secure authentication.

## Authentication Type

- **Type**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <access_token>`
- **Access Token Expiry**: 24 hours (configurable)
- **Refresh Token Expiry**: 7 days (configurable)

## Endpoints

### 1. Signup (Register New User)

Register a new buyer account. Only buyers can self-register; other user types (admin, shop) must be created by administrators.

**Endpoint**: `POST /api/auth/signup`

**Access**: Public

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Validations**:
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters
- `first_name`: Required, non-empty string
- `last_name`: Required, non-empty string
- `phone`: Optional, string

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "buyer",
      "phone": "+1234567890",
      "profile_photo": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1..."
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
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
- `400 Bad Request`: User already exists
  ```json
  {
    "success": false,
    "message": "User with this email already exists"
  }
  ```

---

### 2. Login

Authenticate a user and receive access and refresh tokens. All user types can login.

**Endpoint**: `POST /api/auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Validations**:
- `email`: Required, valid email format
- `password`: Required, non-empty string

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "user_type": "buyer",
      "phone": "+1234567890",
      "profile_photo": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1..."
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```
- `403 Forbidden`: Account not active
  ```json
  {
    "success": false,
    "message": "Account is suspended. Reason: Violation of terms"
  }
  ```

---

### 3. Refresh Token

Obtain new access and refresh tokens using a valid refresh token.

**Endpoint**: `POST /api/auth/refresh`

**Access**: Public

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

**Validations**:
- `refreshToken`: Required, non-empty string

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token
  ```json
  {
    "success": false,
    "message": "Invalid refresh token"
  }
  ```

---

### 4. Validate Token

Validate an access token and retrieve user information.

**Endpoint**: `GET /api/auth/validate`

**Access**: Public

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "user_type": "buyer",
    "status": "active"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Token missing
  ```json
  {
    "success": false,
    "message": "Authentication token is required"
  }
  ```
- `401 Unauthorized`: Invalid token
  ```json
  {
    "success": false,
    "message": "Invalid token"
  }
  ```

---

### 5. Logout

Logout the current user. In production, this would typically blacklist the token.

**Endpoint**: `POST /api/auth/logout`

**Access**: Protected (requires authentication)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses**:
- `401 Unauthorized`: Token missing or invalid

---

## JWT Token Structure

### Access Token Payload
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "user_type": "buyer",
  "status": "active",
  "iat": 1676246400,
  "exp": 1676332800
}
```

### Refresh Token Payload
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "iat": 1676246400,
  "exp": 1676851200
}
```

## User Types

- `admin` - System administrators (created by system)
- `shop` - Shop managers/staff (created by admin)
- `buyer` - Regular customers (can self-register)

## Security Notes

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **Token Storage**: Store tokens securely on the client side (preferably in httpOnly cookies for refresh tokens)
3. **Token Expiry**: Access tokens expire in 24 hours, refresh tokens in 7 days (configurable via environment variables)
4. **HTTPS**: Always use HTTPS in production to prevent token interception
5. **Account Status**: Suspended or blocked accounts cannot login

## Environment Variables

Configure JWT settings in your `.env` file:

```env
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Resource created |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / Invalid credentials |
| 403 | Forbidden / Account not active |
| 500 | Internal server error |
