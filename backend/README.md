# VoyageIQ Backend Foundation

This is the backend foundation for **VoyageIQ**, a travel planning application built with Node.js, Express.js, PostgreSQL, and Prisma ORM.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Prisma ORM
* **Validation:** Zod
* **Authentication & Security:** JWT, bcryptjs, Helmet, CORS
* **Logging:** Morgan

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment configuration & Prisma client instance
│   ├── controllers/     # Controller functions handling HTTP requests
│   ├── middleware/      # Security, CORS, logging, validation & error handlers
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic layer (for future modules)
│   ├── utils/           # Helper utilities (AsyncHandler, ApiError, ApiResponse)
│   ├── validators/      # Zod validation schemas
│   ├── prisma/          # Prisma extensions / seeds
│   └── app.js           # Express app initialization & middleware configuration
├── prisma/
│   └── schema.prisma    # PostgreSQL database schema definition
├── .env                 # Environment variables (git-ignored)
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
└── README.md            # Documentation
```

---

## Setup Instructions

### 1. Installation

Clone the repository and navigate into the `backend` folder:

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to create your local `.env` configuration file:

```bash
cp .env.example .env
```

Configure your `.env` parameters:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voyageiq?schema=public"
JWT_SECRET="your_custom_jwt_secret_key"
FRONTEND_URL="http://localhost:3000"
```

### 3. PostgreSQL Setup

Ensure PostgreSQL is running locally or remotely, and create a database named `voyageiq`:

```sql
CREATE DATABASE voyageiq;
```

Update the `DATABASE_URL` in `.env` with your PostgreSQL username, password, host, port, and database name.

### 4. Prisma Setup & Generation

Generate the Prisma Client based on the schema:

```bash
npm run prisma:generate
```

### 5. Database Migration

Run database migrations to initialize the PostgreSQL database schema:

```bash
npm run prisma:migrate
```

### 6. Development Server

Start the backend server in development mode (with hot reloading via `nodemon`):

```bash
npm run dev
```

Or start in production mode:

```bash
npm start
```

---

## API Endpoints

### Base URL: `/api/v1`

#### Health Check

* **Endpoint:** `GET /api/v1/health`
* **Response:**

```json
{
  "success": true,
  "message": "VoyageIQ API is running"
}
```

---

## API & Architecture Guidelines

* **Modular Architecture:** All new modules (e.g. Auth, Trips, Users) should follow the `routes -> middleware -> controllers -> services -> utils` flow.
* **Error Handling:** All async routes use `asyncHandler` and forward errors to the centralized `errorHandler` middleware.
* **Validation:** Incoming request payloads should be validated using Zod schemas via the `validate` middleware.
