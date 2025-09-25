# API Endpoints

## User Management

### GET /api/users
Retrieve all users in the system.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 10
  }
}
```

### POST /api/users
Create a new user account.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure123",
  "role": "user"
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

## Authentication

### POST /auth/login
Authenticate user credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com"
  },
  "expires_at": "2024-01-01T24:00:00Z"
}
```