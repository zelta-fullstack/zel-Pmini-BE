# Implementation Plan: Bandung Tourism API

## Overview

This implementation plan breaks down the Bandung Tourism API backend into discrete coding tasks. The API is built with Node.js and Express.js, using ES Modules and in-memory data storage for MVP Phase 1. The focus is on core functionality implementation with manual integration testing against the frontend for validation.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create directory structure: `src/data/`, `src/routes/`, `src/middleware/`
  - Verify package.json has required dependencies: express, cors, dotenv
  - Install nodemon for development
  - Create .env.example with PORT, NODE_ENV, FRONTEND_URL
  - Update package.json scripts for dev and start
  - _Requirements: 7.1, 9.1_

- [x] 2. Implement in-memory destination data store
  - Create src/data/destinations.js with ES module exports
  - Define destination data structure with all required fields
  - Initialize array with at least 15 Bandung tourism destinations
  - Include varied data: some with pricing, some with operating hours
  - Export `getAllDestinations()` function returning array copy
  - Export `getDestinationById(id)` function with undefined fallback
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Implement destination route handlers
  - Create src/routes/destinations.js with Express router
  - Import getAllDestinations and getDestinationById from data store
  - Implement GET / handler returning all destinations with status 200
  - Implement GET /:id handler with 200 for valid IDs, 404 for invalid
  - Use try-catch blocks to pass errors to next() middleware
  - Export router as default
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 4. Implement error handler middleware
  - Create src/middleware/errorHandler.js
  - Implement error handler with (err, req, res, next) signature
  - Log errors to console for debugging
  - Determine status code (err.statusCode || 500)
  - Format JSON error response with error name and message
  - Sanitize error messages in production (hide stack traces)
  - Export errorHandler function
  - _Requirements: 5.2, 5.3_

- [x] 5. Checkpoint - Review data layer and middleware
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement server entry point
  - Create server.js with Express app setup
  - Import dotenv and configure at top of file
  - Create Express app instance
  - Implement request logger middleware inline (log method, URL, timestamp, status)
  - Configure CORS with origin from process.env.FRONTEND_URL (default '\*')
  - Add express.json() body parser middleware
  - Register destination routes at /api/destinations
  - Add GET /api/health endpoint returning status 'ok' and timestamp
  - Add 404 handler for unmatched routes
  - Register error handler middleware (must be last)
  - Start server on process.env.PORT (default 5000)
  - Log success message with port number
  - _Requirements: 3.1, 5.1, 6.1, 7.1, 7.2, 9.1, 9.2, 9.3_

- [x] 7. Manual integration testing with frontend
  - Start backend server on port 5000
  - Verify GET /api/destinations returns all destinations
  - Verify GET /api/destinations/:id works for valid and invalid IDs
  - Verify GET /api/health returns health status
  - Test CORS by making requests from frontend origin
  - Confirm frontend successfully displays all destinations
  - Confirm frontend detail page works for individual destinations
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.1_

- [x] 8. Final checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.
  - Verify .env.example is complete
  - Confirm README.md has setup and run instructions
  - Check error handling covers all edge cases
  - Validate CORS configuration is secure for production

## Notes

- ES Modules syntax (import/export) used throughout per package.json configuration
- Focus on clean implementation following design specifications
- Manual integration testing with frontend validates real-world usage
- Each implementation task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback opportunities
- All tasks are required for a complete, functional backend API
- The backend will be validated by running it with the existing frontend application

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1"]
    },
    {
      "id": 1,
      "tasks": ["2", "4"]
    },
    {
      "id": 2,
      "tasks": ["3"]
    },
    {
      "id": 3,
      "tasks": ["6"]
    },
    {
      "id": 4,
      "tasks": ["7"]
    }
  ]
}
```
