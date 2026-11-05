# Design Document: Bandung Tourism API

## Overview

The Bandung Tourism API is a REST API backend service built with Node.js and Express.js that provides tourism destination data to a React frontend application. This MVP Phase 1 implementation focuses on simplicity and rapid development with in-memory data storage, eliminating database complexity while delivering core functionality.

### Design Goals

- **Simplicity**: Minimal architecture with clear separation of concerns
- **Reliability**: Robust error handling and consistent response formats
- **Maintainability**: Clean code structure that's easy to extend
- **Integration**: Seamless CORS support for frontend communication
- **Observability**: Request logging for debugging and monitoring

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.x
- **Middleware**: cors, dotenv
- **Data Storage**: In-memory JavaScript array (MVP Phase 1)

## Architecture

### System Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
└────────┬────────┘
         │ HTTP GET
         │ (CORS enabled)
         ▼
┌─────────────────────────────────────┐
│   Express.js API Server (Port 5000) │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Middleware Pipeline        │  │
│  │   1. Request Logger          │  │
│  │   2. CORS Handler            │  │
│  │   3. JSON Body Parser        │  │
│  │   4. Route Handlers          │  │
│  │   5. Error Handler           │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Route Handlers             │  │
│  │   - GET /api/destinations    │  │
│  │   - GET /api/destinations/:id│  │
│  │   - GET /api/health          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   In-Memory Data Store       │  │
│  │   destinations[] array       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Request Flow

1. **Incoming Request**: Client sends HTTP GET request
2. **Request Logger**: Logs method, URL, and timestamp
3. **CORS Handler**: Adds CORS headers for cross-origin access
4. **JSON Parser**: Parses request body (if present)
5. **Route Handler**: Processes request and retrieves data
6. **Response**: Returns JSON data with appropriate status code
7. **Error Handler**: Catches any errors and formats error response

### Middleware Execution Order

The middleware order is critical for correct operation:

```javascript
// 1. Request logger - must be first to log all requests
app.use(requestLogger);

// 2. CORS - must be early to handle preflight requests
app.use(cors());

// 3. Body parser - parses JSON before route handlers
app.use(express.json());

// 4. Route handlers - business logic
app.use("/api/destinations", destinationRoutes);
app.get("/api/health", healthHandler);

// 5. 404 handler - catches unmatched routes
app.use(notFoundHandler);

// 6. Error handler - must be last, handles all errors
app.use(errorHandler);
```

## Components and Interfaces

### 1. Server Entry Point (server.js)

The main application entry point that orchestrates all components.

**Responsibilities**:

- Load environment configuration
- Initialize Express app
- Register middleware in correct order
- Start HTTP server
- Handle server startup errors

**Interface**:

```javascript
// No exported interface - entry point only
// Depends on: dotenv, express, routes, middleware
```

**Pseudocode**:

```javascript
// Load environment variables
require("dotenv").config();

// Create Express app
const app = express();

// Register middleware pipeline
app.use(requestLogger);
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Register routes
app.use("/api/destinations", destinationRoutes);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Destination Data Store (src/data/destinations.js)

In-memory data storage containing tourism destination records.

**Responsibilities**:

- Store destination data in memory
- Provide data access functions
- Maintain data integrity

**Interface**:

```javascript
// Exports:
const destinations = []; // Array of destination objects

module.exports = {
  getAllDestinations: () => Destination[],
  getDestinationById: (id: string) => Destination | undefined
};
```

**Data Structure**:

```javascript
const destination = {
  id: string, // Required: unique identifier
  name: string, // Required: destination name
  description: string, // Required: full description
  image: string, // Required: image URL
  location: {
    // Required: location object
    address: string, // Required: street address
    city: string, // Required: city name
  },
  operatingHours: string, // Optional: operating hours text
  pricing: {
    // Optional: pricing object
    amount: number, // Required if pricing exists
    currency: string, // Required if pricing exists
  },
};
```

**Implementation Notes**:

- Array initialized at module load time with 15+ destinations
- `getAllDestinations()` returns a copy to prevent external mutation
- `getDestinationById()` returns undefined for non-existent IDs

### 3. Destination Routes (src/routes/destinations.js)

Express router handling destination-related endpoints.

**Responsibilities**:

- Handle GET /api/destinations (all destinations)
- Handle GET /api/destinations/:id (single destination)
- Validate request parameters
- Format responses

**Interface**:

```javascript
// Express Router
const router = express.Router();

// GET /api/destinations
router.get("/", getAllDestinationsHandler);

// GET /api/destinations/:id
router.get("/:id", getDestinationByIdHandler);

module.exports = router;
```

**Handler Implementations**:

```javascript
// GET /api/destinations - Return all destinations
const getAllDestinationsHandler = (req, res, next) => {
  try {
    const destinations = getAllDestinations();
    res.status(200).json(destinations);
  } catch (error) {
    next(error); // Pass to error handler
  }
};

// GET /api/destinations/:id - Return single destination
const getDestinationByIdHandler = (req, res, next) => {
  try {
    const { id } = req.params;
    const destination = getDestinationById(id);

    if (!destination) {
      return res.status(404).json({
        error: "Not Found",
        message: `Destination with id '${id}' not found`,
      });
    }

    res.status(200).json(destination);
  } catch (error) {
    next(error);
  }
};
```

### 4. Request Logger Middleware (inline in server.js)

Logs all incoming HTTP requests.

**Responsibilities**:

- Log method, URL, timestamp
- Log response status code
- Pass request to next middleware

**Implementation**:

```javascript
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // Log response status when response finishes
  res.on("finish", () => {
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode}`);
  });

  next();
};
```

### 5. CORS Middleware (cors package)

Enables cross-origin requests from frontend.

**Configuration**:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
```

**Behavior**:

- Adds `Access-Control-Allow-Origin` header to all responses
- Handles OPTIONS preflight requests automatically
- Returns 204 No Content for OPTIONS requests

### 6. Error Handler Middleware (src/middleware/errorHandler.js)

Centralized error handling for consistent error responses.

**Responsibilities**:

- Catch all errors from route handlers
- Format error responses consistently
- Hide internal error details in production
- Log errors for debugging

**Interface**:

```javascript
// Express error middleware signature
const errorHandler = (err, req, res, next) => {
  // Error handling logic
};

module.exports = errorHandler;
```

**Implementation**:

```javascript
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", err);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Format error response
  const errorResponse = {
    error: err.name || "Internal Server Error",
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  };

  // Send JSON error response
  res.status(statusCode).json(errorResponse);
};
```

### 7. Not Found Handler (inline in server.js)

Catches requests to non-existent routes.

**Implementation**:

```javascript
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
  });
};
```

## Data Models

### Destination Model

The core data model representing a tourism destination.

```typescript
interface Location {
  address: string; // Street address
  city: string; // City name
}

interface Pricing {
  amount: number; // Price amount
  currency: string; // Currency code (e.g., "IDR")
}

interface Destination {
  // Required fields
  id: string;
  name: string;
  description: string;
  image: string;
  location: Location;

  // Optional fields
  operatingHours?: string;
  pricing?: Pricing;
}
```

**Field Specifications**:

| Field            | Type   | Required | Constraints       | Example                         |
| ---------------- | ------ | -------- | ----------------- | ------------------------------- |
| id               | string | Yes      | Unique, non-empty | "floating-market"               |
| name             | string | Yes      | Non-empty         | "Floating Market Lembang"       |
| description      | string | Yes      | Non-empty         | "A unique market experience..." |
| image            | string | Yes      | Valid URL         | "https://example.com/image.jpg" |
| location.address | string | Yes      | Non-empty         | "Jl. Grand Hotel No.33"         |
| location.city    | string | Yes      | Non-empty         | "Bandung"                       |
| operatingHours   | string | No       | -                 | "09:00 - 17:00"                 |
| pricing.amount   | number | No\*     | Positive          | 25000                           |
| pricing.currency | string | No\*     | 3-letter code     | "IDR"                           |

\* If pricing object exists, both amount and currency are required

### Error Response Model

Standardized error response format.

```typescript
interface ErrorResponse {
  error: string; // Error type/name
  message: string; // Human-readable error message
}
```

**Examples**:

```javascript
// 404 Not Found - Invalid route
{
  "error": "Not Found",
  "message": "Route GET /api/invalid not found"
}

// 404 Not Found - Invalid destination ID
{
  "error": "Not Found",
  "message": "Destination with id 'invalid-id' not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Health Response Model

Health check endpoint response format.

```typescript
interface HealthResponse {
  status: string; // "ok" if healthy
  timestamp: string; // ISO 8601 timestamp
}
```

**Example**:

```javascript
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## API Endpoint Specifications

### GET /api/destinations

Retrieve all tourism destinations.

**Request**:

- Method: GET
- Path: /api/destinations
- Headers: None required
- Body: None

**Response**:

- Status: 200 OK
- Content-Type: application/json
- Body: Array of Destination objects

**Example**:

```javascript
// Request
GET /api/destinations

// Response
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "floating-market",
    "name": "Floating Market Lembang",
    "description": "A unique market experience...",
    "image": "https://example.com/floating-market.jpg",
    "location": {
      "address": "Jl. Grand Hotel No.33",
      "city": "Bandung"
    },
    "operatingHours": "09:00 - 17:00",
    "pricing": {
      "amount": 25000,
      "currency": "IDR"
    }
  },
  // ... more destinations
]
```

### GET /api/destinations/:id

Retrieve a specific destination by ID.

**Request**:

- Method: GET
- Path: /api/destinations/:id
- Path Parameters:
  - id (string): Destination identifier
- Headers: None required
- Body: None

**Success Response**:

- Status: 200 OK
- Content-Type: application/json
- Body: Single Destination object

**Error Response**:

- Status: 404 Not Found
- Content-Type: application/json
- Body: ErrorResponse object

**Examples**:

```javascript
// Request - Success
GET /api/destinations/floating-market

// Response - Success
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "floating-market",
  "name": "Floating Market Lembang",
  "description": "A unique market experience...",
  "image": "https://example.com/floating-market.jpg",
  "location": {
    "address": "Jl. Grand Hotel No.33",
    "city": "Bandung"
  },
  "operatingHours": "09:00 - 17:00",
  "pricing": {
    "amount": 25000,
    "currency": "IDR"
  }
}

// Request - Not Found
GET /api/destinations/invalid-id

// Response - Not Found
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Not Found",
  "message": "Destination with id 'invalid-id' not found"
}
```

### GET /api/health

Health check endpoint for monitoring.

**Request**:

- Method: GET
- Path: /api/health
- Headers: None required
- Body: None

**Response**:

- Status: 200 OK
- Content-Type: application/json
- Body: HealthResponse object

**Example**:

```javascript
// Request
GET /api/health

// Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Acceptance Criteria Testing Prework

**1.1** WHEN a GET request is received at `/api/destinations`, THE Destination_Endpoint SHALL return HTTP status 200 with a JSON array

- **Thoughts**: This is testing a specific endpoint behavior. It's a concrete example of what should happen when hitting a specific route.
- **Classification**: EXAMPLE
- **Test Strategy**: Single test verifying the endpoint returns 200 and an array

**1.2** WHEN a GET request is received at `/api/destinations`, THE Destination_Endpoint SHALL return all destinations from the Destination_Store with fields: id, name, description, image, location (address, city), operatingHours (optional), pricing (optional)

- **Thoughts**: This tests that the response structure matches the expected schema for all destinations. We can test this by verifying each destination in the response has the required fields with correct types.
- **Classification**: PROPERTY
- **Test Strategy**: For any destination returned, verify it has all required fields with correct types

**2.1** WHEN a GET request is received at `/api/destinations/:id` with a Valid_Destination_ID, THE Destination_Endpoint SHALL return HTTP status 200 with a JSON object containing the matching destination

- **Thoughts**: This applies to all valid IDs in the system. For any valid destination ID, requesting it should return that specific destination.
- **Classification**: PROPERTY
- **Test Strategy**: For any valid destination ID, verify the response contains that exact destination

**2.2** IF a GET request is received at `/api/destinations/:id` with an Invalid_Destination_ID, THEN THE Destination_Endpoint SHALL return HTTP status 404 with a JSON error message

- **Thoughts**: This should hold for all invalid IDs. Any ID that doesn't exist should produce a 404.
- **Classification**: PROPERTY
- **Test Strategy**: Generate random non-existent IDs and verify all return 404

**3.1** WHEN a GET request is received at `/api/health`, THE Health_Endpoint SHALL return HTTP status 200 with a JSON object indicating the server is operational

- **Thoughts**: This is testing a specific endpoint. The response doesn't vary with input.
- **Classification**: EXAMPLE
- **Test Strategy**: Single test verifying health endpoint returns 200 with expected structure

**4.1** WHEN any request is received, THE CORS_Middleware SHALL add appropriate CORS headers to allow cross-origin requests from the frontend

- **Thoughts**: This applies to all requests. For any request, CORS headers should be present.
- **Classification**: PROPERTY
- **Test Strategy**: For any endpoint, verify CORS headers are present in response

**4.2** WHEN an OPTIONS preflight request is received, THE CORS_Middleware SHALL handle it with appropriate headers and HTTP status 204

- **Thoughts**: This is testing specific preflight behavior. It's a concrete scenario.
- **Classification**: EXAMPLE
- **Test Strategy**: Send OPTIONS request and verify 204 response with headers

**5.1** IF a request is made to a non-existent route, THEN THE API_Server SHALL return HTTP status 404 with a JSON error message

- **Thoughts**: This applies to all non-existent routes. Any invalid route should return 404.
- **Classification**: PROPERTY
- **Test Strategy**: Generate random invalid routes and verify all return 404

**5.2** IF a Server_Error occurs during request processing, THEN THE Error_Handler SHALL return HTTP status 500 with a JSON error message without exposing internal implementation details

- **Thoughts**: This should hold for all server errors. Any error during processing should produce a safe 500 response.
- **Classification**: PROPERTY
- **Test Strategy**: Trigger various server errors and verify all produce sanitized 500 responses

**5.3** WHEN any error response is returned, THE API_Server SHALL set the Content-Type header to `application/json`

- **Thoughts**: This applies to all error responses. Every error should have JSON content type.
- **Classification**: PROPERTY
- **Test Strategy**: Trigger various errors and verify all have application/json content type

**6.1** WHEN any HTTP request is received, THE Request_Logger SHALL log the HTTP method, URL path, timestamp, and response status code

- **Thoughts**: This applies to all requests. Every request should be logged with these details. However, testing logging is tricky - we're testing side effects (console output), not return values. This is better verified through integration tests that check logs.
- **Classification**: INTEGRATION
- **Test Strategy**: Make various requests and verify log output contains expected information

**7.1** WHEN the API_Server starts, THE Environment_Config SHALL load PORT and NODE_ENV values from the .env file

- **Thoughts**: This is testing one-time initialization behavior. It happens once at startup.
- **Classification**: SMOKE
- **Test Strategy**: Start server with different .env configurations and verify correct values are loaded

**7.2** IF the PORT value is not defined in the .env file, THEN THE Environment_Config SHALL use 5000 as the default port

- **Thoughts**: This is testing specific default behavior. It's a concrete edge case.
- **Classification**: EXAMPLE
- **Test Strategy**: Start server without PORT in .env and verify default 5000 is used

**8.1** WHEN the API_Server starts, THE Destination_Store SHALL initialize with at least 15 tourism destination records

- **Thoughts**: This is testing one-time initialization. It happens once at startup.
- **Classification**: SMOKE
- **Test Strategy**: Start server and verify destination store contains at least 15 records

**8.2** THE Destination_Store SHALL contain destinations where each record has required fields: unique id, name, description, image URL, location object (address, city)

- **Thoughts**: This applies to all destinations in the store. Every destination should have these required fields.
- **Classification**: PROPERTY
- **Test Strategy**: For any destination in the store, verify it has all required fields with correct types

**8.3** THE Destination_Store SHALL contain destinations where some records include optional fields: operatingHours, pricing object (amount, currency)

- **Thoughts**: This is testing that at least some destinations have optional fields. It's about the composition of the data set, not individual properties.
- **Classification**: EXAMPLE
- **Test Strategy**: Verify at least one destination has operatingHours and at least one has pricing

**9.1** WHEN the API_Server starts, THE API_Server SHALL bind to the port specified in the Environment_Config and log a success message with the port number

- **Thoughts**: This is testing startup behavior. It's a one-time initialization check.
- **Classification**: SMOKE
- **Test Strategy**: Start server and verify it binds to correct port and logs success message

**9.2** IF the API_Server fails to bind to the specified port, THEN THE API_Server SHALL log an error message and exit

- **Thoughts**: This is testing specific error handling during startup. It's a concrete edge case.
- **Classification**: EXAMPLE
- **Test Strategy**: Try to start server on occupied port and verify error handling

**9.3** WHEN the API_Server starts, THE API_Server SHALL register middleware in the correct order: Request_Logger, CORS_Middleware, JSON body parser, routes, Error_Handler

- **Thoughts**: This is about architectural structure. It's not something we can test with automated property tests - it's a code structure verification.
- **Classification**: INTEGRATION
- **Test Strategy**: Review code structure to verify middleware registration order

**10.1** WHEN any response is returned, THE API_Server SHALL return valid JSON with appropriate Content-Type header

- **Thoughts**: This applies to all responses. Every response should be valid JSON with correct content type.
- **Classification**: PROPERTY
- **Test Strategy**: For any endpoint, verify response is valid JSON and has application/json content type

**10.2** WHEN a destination object is returned, THE API_Server SHALL ensure fields match expected types: id (string), name (string), description (string), pricing.amount (number if present), location.address (string), location.city (string)

- **Thoughts**: This applies to all destination objects. Every destination returned should have correct field types.
- **Classification**: PROPERTY
- **Test Strategy**: For any destination returned, verify all fields have correct types

### Reflection on Properties

After reviewing all testable properties, I've identified the following consolidations:

1. **Properties 1.2, 8.2, and 10.2** all test destination object structure validation. These can be combined into a single comprehensive property: "All destinations have valid structure with correct field types"

2. **Property 10.1** (valid JSON with content type) is partially redundant with **Property 5.3** (error responses have JSON content type). However, 10.1 is broader (all responses), so we keep it and can remove 5.3 as a separate property.

3. **Properties 2.1 and 2.2** test the lookup behavior for valid and invalid IDs. While related, they test different outcomes and should remain separate.

4. **Property 4.1** (CORS headers on all requests) is valuable and unique.

5. **Property 5.1** (404 for non-existent routes) and **Property 5.2** (500 for server errors) test different error scenarios and should remain separate.

**Consolidated Properties**: We'll write 8 properties covering the unique validation needs.

### Property 1: Destination Structure Validity

_For any_ destination returned by the API (either from `/api/destinations` or `/api/destinations/:id`), the destination SHALL have all required fields with correct types: id (string), name (string), description (string), image (string), location.address (string), location.city (string), and if optional fields are present, operatingHours (string), pricing.amount (number), pricing.currency (string).

**Validates: Requirements 1.2, 8.2, 10.2**

### Property 2: Valid ID Lookup Returns Matching Destination

_For any_ valid destination ID that exists in the Destination_Store, making a GET request to `/api/destinations/:id` SHALL return HTTP status 200 with a JSON object containing the destination matching that ID.

**Validates: Requirements 2.1**

### Property 3: Invalid ID Lookup Returns 404

_For any_ destination ID that does not exist in the Destination_Store, making a GET request to `/api/destinations/:id` SHALL return HTTP status 404 with a JSON error message.

**Validates: Requirements 2.2**

### Property 4: CORS Headers Present on All Responses

_For any_ API endpoint, the response SHALL include appropriate CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) to enable cross-origin requests.

**Validates: Requirements 4.1**

### Property 5: Non-Existent Routes Return 404

_For any_ route path that does not match a defined API endpoint, making a request SHALL return HTTP status 404 with a JSON error message.

**Validates: Requirements 5.1**

### Property 6: Server Errors Return Sanitized 500 Response

_For any_ server error that occurs during request processing, the Error_Handler SHALL return HTTP status 500 with a JSON error message that does not expose internal implementation details (stack traces, file paths, etc.).

**Validates: Requirements 5.2**

### Property 7: All Responses Are Valid JSON

_For any_ API endpoint and any request, the response SHALL be valid JSON with Content-Type header set to `application/json`.

**Validates: Requirements 5.3, 10.1**

### Property 8: Destination IDs Are Unique

_For any_ two destinations in the Destination_Store, they SHALL have different id values (no duplicate IDs).

**Validates: Requirements 8.2**

## Error Handling

### Error Categories

The API handles three categories of errors:

1. **Client Errors (4xx)**
   - 404 Not Found: Non-existent routes or resources
2. **Server Errors (5xx)**
   - 500 Internal Server Error: Unexpected errors during processing

3. **CORS Preflight**
   - 204 No Content: Successful OPTIONS preflight handling

### Error Response Format

All error responses follow a consistent JSON structure:

```javascript
{
  "error": "Error Type",
  "message": "Human-readable error description"
}
```

### Error Handling Flow

```
Request → Route Handler
              ↓
         Error occurs?
              ↓
         Yes ↓     No → Success Response
              ↓
         next(error)
              ↓
    Error Handler Middleware
              ↓
    ┌─────────────────┐
    │ Determine Status │
    │ - 404: Not Found │
    │ - 500: Server    │
    └─────────────────┘
              ↓
    ┌─────────────────────┐
    │ Format Error Response│
    │ - Hide details in    │
    │   production         │
    │ - Log for debugging  │
    └─────────────────────┘
              ↓
         JSON Response
```

### Error Handling Implementation

**404 Not Found - Missing Resource**:

```javascript
// In route handler
const destination = getDestinationById(id);
if (!destination) {
  return res.status(404).json({
    error: "Not Found",
    message: `Destination with id '${id}' not found`,
  });
}
```

**404 Not Found - Invalid Route**:

```javascript
// After all routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
  });
});
```

**500 Internal Server Error**:

```javascript
// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message;

  res.status(statusCode).json({
    error: err.name || "Internal Server Error",
    message: message,
  });
};
```

### Error Security Considerations

- **Production Mode**: Hide internal error details (stack traces, file paths)
- **Development Mode**: Include detailed error information for debugging
- **Logging**: Always log full error details server-side regardless of mode
- **Sanitization**: Never expose sensitive data in error messages

## Testing Strategy

### Dual Testing Approach

The Bandung Tourism API uses a comprehensive testing strategy combining:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across all inputs
3. **Integration Tests**: Verify infrastructure, logging, and startup behavior

### Unit Testing

**Focus Areas**:

- Specific endpoint behaviors (health check returns 200)
- Edge cases (empty optional fields, port conflicts)
- Concrete scenarios (OPTIONS preflight handling)
- Data set composition (at least one destination has pricing)

**Example Tests**:

```javascript
// GET /api/destinations returns 200 with array
test("GET /api/destinations returns 200 OK", async () => {
  const response = await request(app).get("/api/destinations");
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});

// Health endpoint returns expected structure
test("GET /api/health returns health status", async () => {
  const response = await request(app).get("/api/health");
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("status", "ok");
  expect(response.body).toHaveProperty("timestamp");
});

// OPTIONS preflight returns 204
test("OPTIONS request returns 204 No Content", async () => {
  const response = await request(app).options("/api/destinations");
  expect(response.status).toBe(204);
});

// Default port is 5000
test("Server uses default port 5000 when PORT not set", () => {
  delete process.env.PORT;
  const port = process.env.PORT || 5000;
  expect(port).toBe(5000);
});
```

### Property-Based Testing

**Property Test Library**: fast-check (JavaScript)

**Configuration**:

- Minimum 100 iterations per property test
- Each test tagged with property reference

**Property Tests**:

```javascript
// Property 1: Destination Structure Validity
test("Property 1: All destinations have valid structure", () => {
  // Feature: bandung-tourism-api, Property 1: Destination Structure Validity
  fc.assert(
    fc.property(fc.constantFrom(...getAllDestinations()), (destination) => {
      expect(typeof destination.id).toBe("string");
      expect(typeof destination.name).toBe("string");
      expect(typeof destination.description).toBe("string");
      expect(typeof destination.image).toBe("string");
      expect(typeof destination.location.address).toBe("string");
      expect(typeof destination.location.city).toBe("string");

      if (destination.operatingHours) {
        expect(typeof destination.operatingHours).toBe("string");
      }

      if (destination.pricing) {
        expect(typeof destination.pricing.amount).toBe("number");
        expect(typeof destination.pricing.currency).toBe("string");
      }
    }),
    { numRuns: 100 },
  );
});

// Property 2: Valid ID Lookup Returns Matching Destination
test("Property 2: Valid ID returns matching destination", async () => {
  // Feature: bandung-tourism-api, Property 2: Valid ID Lookup
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...getAllDestinations().map((d) => d.id)),
      async (validId) => {
        const response = await request(app).get(`/api/destinations/${validId}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(validId);
      },
    ),
    { numRuns: 100 },
  );
});

// Property 3: Invalid ID Lookup Returns 404
test("Property 3: Invalid ID returns 404", async () => {
  // Feature: bandung-tourism-api, Property 3: Invalid ID Lookup
  fc.assert(
    fc.asyncProperty(
      fc
        .string()
        .filter((id) => !getAllDestinations().some((d) => d.id === id)),
      async (invalidId) => {
        const response = await request(app).get(
          `/api/destinations/${invalidId}`,
        );
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error");
        expect(response.body).toHaveProperty("message");
      },
    ),
    { numRuns: 100 },
  );
});

// Property 4: CORS Headers Present on All Responses
test("Property 4: CORS headers present on all endpoints", async () => {
  // Feature: bandung-tourism-api, Property 4: CORS Headers
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom("/api/destinations", "/api/health"),
      async (endpoint) => {
        const response = await request(app).get(endpoint);
        expect(response.headers).toHaveProperty("access-control-allow-origin");
      },
    ),
    { numRuns: 100 },
  );
});

// Property 5: Non-Existent Routes Return 404
test("Property 5: Non-existent routes return 404", async () => {
  // Feature: bandung-tourism-api, Property 5: Non-Existent Routes
  fc.assert(
    fc.asyncProperty(
      fc
        .string()
        .filter(
          (path) =>
            !path.startsWith("/api/destinations") &&
            !path.startsWith("/api/health"),
        ),
      async (invalidPath) => {
        const response = await request(app).get(invalidPath);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error");
      },
    ),
    { numRuns: 100 },
  );
});

// Property 6: Server Errors Return Sanitized 500 Response
test("Property 6: Server errors return sanitized 500", async () => {
  // Feature: bandung-tourism-api, Property 6: Sanitized Server Errors
  // Mock a route that throws various errors
  app.get("/test-error", (req, res, next) => {
    throw new Error("Test error with stack trace");
  });

  fc.assert(
    fc.asyncProperty(fc.string(), async (errorMessage) => {
      const response = await request(app).get("/test-error");
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      // Should not expose stack trace in production
      if (process.env.NODE_ENV === "production") {
        expect(response.body.message).not.toContain("at ");
      }
    }),
    { numRuns: 100 },
  );
});

// Property 7: All Responses Are Valid JSON
test("Property 7: All responses are valid JSON", async () => {
  // Feature: bandung-tourism-api, Property 7: Valid JSON Responses
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom("/api/destinations", "/api/health", "/api/invalid"),
      async (endpoint) => {
        const response = await request(app).get(endpoint);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
        expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
      },
    ),
    { numRuns: 100 },
  );
});

// Property 8: Destination IDs Are Unique
test("Property 8: All destination IDs are unique", () => {
  // Feature: bandung-tourism-api, Property 8: Unique IDs
  const destinations = getAllDestinations();
  const ids = destinations.map((d) => d.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(ids.length);
});
```

### Integration Testing

**Focus Areas**:

- Request logging (verify console output)
- Server startup (verify port binding and initialization)
- Middleware execution order (verify through request tracing)

**Example Integration Tests**:

```javascript
// Verify request logging
test("Integration: Requests are logged", async () => {
  const consoleSpy = jest.spyOn(console, "log");
  await request(app).get("/api/health");
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining("GET /api/health"),
  );
  consoleSpy.mockRestore();
});

// Verify server starts on correct port
test("Integration: Server starts on configured port", async () => {
  process.env.PORT = "3000";
  // Start server and verify it binds to port 3000
  // Implementation depends on test setup
});

// Verify destination store initializes with data
test("Integration: Destination store contains 15+ destinations", () => {
  const destinations = getAllDestinations();
  expect(destinations.length).toBeGreaterThanOrEqual(15);
});
```

### Test Coverage Goals

- **Unit Tests**: 80% statement coverage minimum
- **Property Tests**: All 8 correctness properties implemented
- **Integration Tests**: All infrastructure and logging verified
- **End-to-End**: Manual testing of frontend integration

### Testing Tools

- **Test Framework**: Jest
- **HTTP Testing**: supertest
- **Property-Based Testing**: fast-check
- **Mocking**: jest mocks for console, environment variables

## Configuration Management

### Environment Variables

Configuration is loaded from a `.env` file in the project root.

**Required Variables**:

- `PORT`: Server port number (default: 5000)
- `NODE_ENV`: Environment mode (development, production)

**Optional Variables**:

- `FRONTEND_URL`: Allowed CORS origin (default: \*)

**Example .env file**:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Configuration Loading

```javascript
// Load at application startup
require("dotenv").config();

// Access configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "*";
```

### Configuration Validation

Basic validation on server startup:

```javascript
// Validate PORT is a number
const port = parseInt(process.env.PORT || "5000", 10);
if (isNaN(port)) {
  console.error("Invalid PORT configuration");
  process.exit(1);
}

// Validate NODE_ENV is valid
const validEnvs = ["development", "production", "test"];
if (NODE_ENV && !validEnvs.includes(NODE_ENV)) {
  console.warn(`Invalid NODE_ENV: ${NODE_ENV}, using 'development'`);
}
```

## File Structure

```
zel-BEPmini/
├── .env                          # Environment configuration
├── .env.example                  # Example environment file
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Locked dependencies
├── README.md                     # Project documentation
├── server.js                     # Application entry point
└── src/
    ├── data/
    │   └── destinations.js       # In-memory data store
    ├── routes/
    │   └── destinations.js       # Destination route handlers
    └── middleware/
        └── errorHandler.js       # Error handling middleware
```

### File Responsibilities

**server.js**:

- Application entry point
- Express app initialization
- Middleware registration
- Server startup

**src/data/destinations.js**:

- Destination data storage
- Data access functions
- Sample data initialization

**src/routes/destinations.js**:

- Destination endpoint handlers
- Request validation
- Response formatting

**src/middleware/errorHandler.js**:

- Centralized error handling
- Error response formatting
- Error logging

## Implementation Notes

### Development Workflow

1. **Setup**:

   ```bash
   npm install
   cp .env.example .env
   # Edit .env with local configuration
   ```

2. **Development**:

   ```bash
   npm run dev  # Start with nodemon for auto-reload
   ```

3. **Testing**:

   ```bash
   npm test              # Run all tests
   npm run test:unit     # Run unit tests only
   npm run test:property # Run property tests only
   ```

4. **Production**:
   ```bash
   npm start  # Start production server
   ```

### Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:property": "jest --testPathPattern=property",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Dependencies

**Production**:

- `express`: ^4.18.0 - Web framework
- `cors`: ^2.8.5 - CORS middleware
- `dotenv`: ^16.0.0 - Environment configuration

**Development**:

- `nodemon`: ^3.0.0 - Auto-reload during development
- `jest`: ^29.0.0 - Test framework
- `supertest`: ^6.3.0 - HTTP testing
- `fast-check`: ^3.0.0 - Property-based testing

### Performance Considerations

**MVP Phase 1 Constraints**:

- In-memory data store limits scalability
- No caching layer (acceptable for 15 destinations)
- No rate limiting (add in Phase 2)
- No pagination (add when destination count grows)

**Expected Performance**:

- Response time: <50ms for all endpoints
- Concurrent requests: 100+ (Node.js event loop)
- Memory usage: <100MB (small data set)

### Security Considerations

**Current Implementation**:

- CORS configured for frontend origin
- Error messages sanitized in production
- No sensitive data in logs
- Environment variables for configuration

**Future Enhancements** (Phase 2+):

- Rate limiting to prevent abuse
- Input validation middleware
- Request size limits
- Security headers (helmet)
- HTTPS enforcement

### Migration Path to Database

When transitioning from in-memory to database storage:

1. **Replace data access functions** in `src/data/destinations.js`:

   ```javascript
   // Before: In-memory
   const getAllDestinations = () => destinations;

   // After: Database
   const getAllDestinations = async () => {
     return await db.query("SELECT * FROM destinations");
   };
   ```

2. **Update route handlers** to handle async operations:

   ```javascript
   // Before: Synchronous
   const destinations = getAllDestinations();

   // After: Asynchronous
   const destinations = await getAllDestinations();
   ```

3. **Add connection management** in server startup
4. **Add database error handling** in error middleware
5. **Update tests** to use database fixtures or mocks

## Deployment Considerations

### Environment Requirements

- **Node.js**: v18 or higher
- **Memory**: 512MB minimum
- **Network**: Port 5000 accessible (or configured port)

### Environment-Specific Configuration

**Development**:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Production**:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Monitoring and Observability

**Current Logging**:

- Console logging for requests
- Console logging for errors
- Server startup confirmation

**Future Enhancements**:

- Structured logging (Winston, Pino)
- Log aggregation (CloudWatch, ELK)
- Application monitoring (New Relic, Datadog)
- Health check endpoint for orchestrators

### Scaling Considerations

**Horizontal Scaling**:

- Stateless design enables easy replication
- Load balancer can distribute traffic
- No session state to synchronize

**Limitations**:

- In-memory data inconsistent across instances
- Requires database for multi-instance deployments

## Summary

This design provides a solid foundation for the Bandung Tourism API MVP Phase 1, with:

- **Simple architecture** using Express.js and in-memory storage
- **Clear separation** of routes, data, and middleware
- **Robust error handling** with consistent JSON responses
- **CORS support** for seamless frontend integration
- **Comprehensive testing** strategy with property-based tests
- **Easy migration path** to database storage in future phases

The implementation focuses on rapid development while maintaining code quality and establishing patterns that will scale as the application grows.
