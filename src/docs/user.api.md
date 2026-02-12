# User API

Base URL: `/api/users`

## Overview

The User API provides endpoints for user profile management and user administration. It uses **JWT (JSON Web Tokens)** for authentication.

## Authentication

All endpoints require authentication via JWT token:

```
Authorization: Bearer <access_token>
```

## Endpoints

### User Profile Endpoints

---

#### 1. Get Current User Profile

Retrieve the authenticated user's profile information.

**Endpoint**: `GET /api/users/profile`

**Access**: Protected (all authenticated users)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "user_type": "buyer",
    "profile_photo": "https://example.com/photo.jpg",
    "registered_at": "2026-02-01T10:30:00.000Z",
    "current_status": {
      "status": "active",
      "updated_at": "2026-02-01T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Token missing or invalid
- `404 Not Found`: User not found

---

#### 2. Update Current User Profile

Update the authenticated user's profile information.

**Endpoint**: `PUT /api/users/profile`

**Access**: Protected (all authenticated users)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1...
Content-Type: application/json
```

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1987654321",
  "profile_photo": "https://example.com/new-photo.jpg"
}
```

**Validations**:
- `first_name`: Optional, non-empty string if provided
- `last_name`: Optional, non-empty string if provided
- `phone`: Optional, string
- `profile_photo`: Optional, valid URL format

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1987654321",
    "user_type": "buyer",
    "profile_photo": "https://example.com/new-photo.jpg",
    "registered_at": "2026-02-01T10:30:00.000Z",
    "current_status": {
      "status": "active",
      "updated_at": "2026-02-01T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Token missing or invalid
- `404 Not Found`: User not found

---

### Admin Endpoints

All admin endpoints require the user to have `admin` user_type.

---

#### 3. Get All Users

Retrieve a paginated list of all users with optional filtering.

**Endpoint**: `GET /api/users`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `user_type` (optional): Filter by user type (admin, brand, shop, buyer)
- `status` (optional): Filter by status (active, suspended, blocked)

**Example Request**:
```
GET /api/users?page=1&limit=10&user_type=buyer&status=active
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "user_type": "buyer",
      "profile_photo": null,
      "registered_at": "2026-02-01T10:30:00.000Z",
      "current_status": {
        "status": "active",
        "updated_at": "2026-02-01T10:30:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin

---

#### 4. Get User by ID

Retrieve detailed information about a specific user.

**Endpoint**: `GET /api/users/:id`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
```

**URL Parameters**:
- `id`: MongoDB ObjectId of the user

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "user_type": "buyer",
    "profile_photo": "https://example.com/photo.jpg",
    "registered_at": "2026-02-01T10:30:00.000Z",
    "current_status": {
      "status": "active",
      "updated_at": "2026-02-01T10:30:00.000Z"
    },
    "status_history": [],
    "update_history": []
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid user ID format
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User not found

---

#### 5. Update User

Update a specific user's information.

**Endpoint**: `PUT /api/users/:id`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
Content-Type: application/json
```

**URL Parameters**:
- `id`: MongoDB ObjectId of the user

**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1987654321",
  "profile_photo": "https://example.com/photo.jpg"
}
```

**Validations**:
- `first_name`: Optional, non-empty string if provided
- `last_name`: Optional, non-empty string if provided
- `phone`: Optional, string
- `profile_photo`: Optional, valid URL format

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1987654321",
    "user_type": "buyer",
    "profile_photo": "https://example.com/photo.jpg",
    "registered_at": "2026-02-01T10:30:00.000Z",
    "current_status": {
      "status": "active",
      "updated_at": "2026-02-01T10:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors or invalid user ID
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User not found

---

#### 6. Update User Status

Update a user's account status (active, suspended, blocked).

**Endpoint**: `PUT /api/users/:id/status`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
Content-Type: application/json
```

**URL Parameters**:
- `id`: MongoDB ObjectId of the user

**Request Body**:
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

**Validations**:
- `status`: Required, must be one of: `active`, `suspended`, `blocked`
- `reason`: Optional, string describing the reason for status change

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "buyer",
    "current_status": {
      "status": "suspended",
      "reason": "Violation of terms of service",
      "updated_at": "2026-02-12T14:30:00.000Z"
    },
    "status_history": [
      {
        "status": "active",
        "updated_at": "2026-02-01T10:30:00.000Z"
      },
      {
        "status": "suspended",
        "reason": "Violation of terms of service",
        "updated_at": "2026-02-12T14:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid status value or user ID
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User not found

---

#### 7. Delete User

Delete a user account permanently.

**Endpoint**: `DELETE /api/users/:id`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
```

**URL Parameters**:
- `id`: MongoDB ObjectId of the user

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid user ID format
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin
- `404 Not Found`: User not found

---

#### 8. Get User Statistics

Retrieve statistics about users in the system.

**Endpoint**: `GET /api/users/stats`

**Access**: Admin only

**Headers**:
```
Authorization: Bearer admin-access-token
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 1247,
    "byType": {
      "admin": 5,
      "brand": 42,
      "shop": 150,
      "buyer": 1050
    },
    "byStatus": {
      "active": 1200,
      "suspended": 35,
      "blocked": 12
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Token missing or invalid
- `403 Forbidden`: User is not an admin

---

## User Types & Permissions

| User Type | Can Access Profile | Can Update Profile | Can Access Admin Endpoints |
|-----------|-------------------|-------------------|---------------------------|
| `admin` | ✅ | ✅ | ✅ |
| `brand` | ✅ | ✅ | ❌ |
| `shop` | ✅ | ✅ | ❌ |
| `buyer` | ✅ | ✅ | ❌ |

## Status Types

- `active`: User account is active and can use the system
- `suspended`: User account is temporarily suspended (can be reactivated)
- `blocked`: User account is permanently blocked

## Update History

The system automatically tracks all profile updates with timestamps. Each update creates a history entry containing:
- Changed fields and their new values
- Timestamp of the update

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / Invalid token |
| 403 | Forbidden / Insufficient permissions |
| 404 | User not found |
| 500 | Internal server error |

## Notes

- Passwords cannot be updated through this API. Use password reset functionality (to be implemented)
- Email addresses cannot be changed after account creation
- User type cannot be changed through the update endpoint
- All timestamps are in ISO 8601 format (UTC)
- Profile photos should be uploaded to a file storage service first, then the URL provided
