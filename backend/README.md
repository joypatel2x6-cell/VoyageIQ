# VoyageIQ Backend Documentation

This repository contains the backend service for **VoyageIQ**, a travel planning and itinerary management application built with Node.js, Express.js, PostgreSQL, and Prisma ORM.

---

## 🛠️ Tech Stack & Architecture

- **Runtime Environment:** Node.js (v18+)
- **Web Framework:** Express.js (v4.21+)
- **Database:** PostgreSQL (Relational DB)
- **Object-Relational Mapping (ORM):** Prisma ORM (v5.22+)
- **Data Validation:** Zod Schema Validation
- **Authentication & Security:** JWT (JSON Web Tokens), `bcryptjs` password hashing, `helmet` security headers, `cors` cross-origin sharing
- **Logging & Utilities:** Morgan HTTP logger, Custom centralized error handler (`ApiError`), Async Handler wrapper

---

## 📁 Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma            # PostgreSQL Database Schema & Indexes
│   ├── seed.js                  # Database Seeding Script (Cities, Activities, Sample Data)
│   ├── verify.js                # Database Relationship & Constraint Verification Script
│   ├── test_master_e2e.js       # Master End-to-End System Integration Test Suite
│   ├── test_admin.js            # Admin Module Integration Test Suite
│   ├── test_sharing.js          # Public Trip Sharing Integration Test Suite
│   └── test_notifications.js    # Notification System Integration Test Suite
├── src/
│   ├── config/                  # Environment (`env.js`) and Prisma Client setup
│   ├── controllers/             # Express controllers for HTTP request handling
│   ├── middleware/              # Authentication (`requireAuth`), Admin (`requireAdmin`), Validation, Error Handlers
│   ├── routes/                  # Express Router modules (Auth, Users, Trips, Budget, Admin, etc.)
│   ├── services/                # Core Business Logic Layer & Aggregation Engines
│   ├── utils/                   # Helper Utilities (Budget math, Health scores, Async wrapper)
│   ├── validators/              # Zod Input & Parameter Validation Schemas
│   ├── app.js                   # Express Application Initialization & Middleware Config
│   └── server.js                # HTTP Server Entrypoint
├── .env                         # Local Environment Variables (git-ignored)
├── .env.example                 # Environment Variable Template
├── package.json                 # Node.js dependencies & scripts
└── README.md                    # Project Documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL connection string)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/voyageiq?schema=public"

# Authentication / Security Configuration
JWT_SECRET="voyageiq_super_secret_jwt_key_2026"

# Frontend Integration
FRONTEND_URL="http://localhost:3000"
```

---

## 🚀 Setup & Execution Guide

### 1. Installation
Install dependencies:
```bash
npm install
```

### 2. Database Migration & Schema Sync
Sync the Prisma schema with your local PostgreSQL database:
```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Sync Database Schema with PostgreSQL
npx prisma db push
```

### 3. Database Seeding
Populate database with sample global cities, activities, users, and trips:
```bash
npm run prisma:seed
```

### 4. Running the Development Server
Start the development server with hot-reloading (`nodemon`):
```bash
npm run dev
```

### 5. Production Server
Start the production node server:
```bash
npm start
```

### 6. Running Integration Tests
Execute the Master End-to-End System Integration Test suite:
```bash
node prisma/test_master_e2e.js
```

---

## 📊 API Standard Response Format

All API endpoints follow a standardized JSON response structure.

### Success Response Format (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {}
}
```

### Error Response Format (HTTP 400 / 401 / 403 / 404 / 409 / 500)
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": []
}
```

---

## 📡 Comprehensive API Endpoint Reference

### 1. Health Check
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | System health check & status |

### 2. Authentication Module (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT |

### 3. User Profile Module (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Private | Get authenticated user profile |
| `PATCH` | `/api/v1/users/me` | Private | Update user profile fields |
| `PATCH` | `/api/v1/users/me/password` | Private | Change user password |
| `DELETE` | `/api/v1/users/me` | Private | Delete user account |
| `GET` | `/api/v1/users/me/saved-destinations` | Private | Get saved destinations |
| `POST` | `/api/v1/users/me/saved-destinations/:cityId` | Private | Save city destination |
| `DELETE` | `/api/v1/users/me/saved-destinations/:cityId` | Private | Remove saved destination |

### 4. Trips Module (`/api/v1/trips`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/trips` | Private | Create a new trip |
| `GET` | `/api/v1/trips` | Private | List user trips with search, filters & pagination |
| `GET` | `/api/v1/trips/:tripId` | Private / Public | Get trip breakdown & budget summary |
| `PATCH` | `/api/v1/trips/:tripId` | Private (Owner) | Update trip details |
| `DELETE` | `/api/v1/trips/:tripId` | Private (Owner) | Delete trip |
| `POST` | `/api/v1/trips/:tripId/duplicate` | Private | Duplicate trip with stops, activities & expenses |

### 5. Trip Stops Module (`/api/v1/trips/:tripId/stops`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/trips/:tripId/stops` | Private (Owner) | Add a city stop to trip |
| `GET` | `/api/v1/trips/:tripId/stops` | Private | Get all stops for a trip |
| `PATCH` | `/api/v1/trips/:tripId/stops/:stopId` | Private (Owner) | Update trip stop dates/notes |
| `DELETE` | `/api/v1/trips/:tripId/stops/:stopId` | Private (Owner) | Delete trip stop |
| `POST` | `/api/v1/trips/:tripId/stops/reorder` | Private (Owner) | Reorder stops via transaction |

### 6. Cities Catalog (`/api/v1/cities`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cities` | Public | List cities with search & filters |
| `GET` | `/api/v1/cities/:cityId` | Public | Get detailed city breakdown |

### 7. Activities Catalog & Trip Scheduling (`/api/v1/activities`, `/api/v1/trips/:tripId/stops/:stopId/activities`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/activities` | Public | Search activity catalog by city/category |
| `POST` | `/api/v1/trips/:tripId/stops/:stopId/activities` | Private (Owner) | Schedule activity into trip stop |
| `GET` | `/api/v1/trips/:tripId/stops/:stopId/activities` | Private | Get activities for a stop |
| `PATCH` | `/api/v1/trips/:tripId/stops/:stopId/activities/:id` | Private (Owner) | Update scheduled activity |
| `DELETE` | `/api/v1/trips/:tripId/stops/:stopId/activities/:id` | Private (Owner) | Remove scheduled activity |
| `POST` | `/api/v1/trips/:tripId/stops/:stopId/activities/reorder` | Private (Owner) | Reorder scheduled activities |

### 8. Expenses & Budget Engine (`/api/v1/trips/:tripId/budget`, `/api/v1/trips/:tripId/expenses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/trips/:tripId/expenses` | Private (Owner) | Add manual expense item |
| `GET` | `/api/v1/trips/:tripId/budget` | Private | Budget overview & category breakdown |
| `GET` | `/api/v1/trips/:tripId/budget/daily` | Private | Daily cost analysis |
| `GET` | `/api/v1/trips/:tripId/budget/insights` | Private | Smart budget recommendations |
| `GET` | `/api/v1/trips/:tripId/budget/health` | Private | Trip health score (0-100) |
| `PATCH` | `/api/v1/trips/:tripId/expenses/:expenseId` | Private (Owner) | Update expense item |
| `DELETE` | `/api/v1/trips/:tripId/expenses/:expenseId` | Private (Owner) | Delete expense item |

### 9. Calendar & Timeline (`/api/v1/trips/:tripId/calendar`, `/api/v1/trips/:tripId/timeline`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/trips/:tripId/calendar` | Private | Get full trip calendar schedule |
| `GET` | `/api/v1/trips/:tripId/timeline` | Private | Get chronological itinerary timeline |
| `GET` | `/api/v1/trips/:tripId/days/:date` | Private | Get single day itinerary breakdown |

### 10. Community Module (`/api/v1/community`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/community/posts` | Private | Publish community post for trip |
| `GET` | `/api/v1/community/posts` | Public | Get public community feed with filters |
| `GET` | `/api/v1/community/posts/:postId` | Public | Get single post details |
| `PATCH` | `/api/v1/community/posts/:postId` | Private (Author) | Update post content |
| `DELETE` | `/api/v1/community/posts/:postId` | Private (Author) | Delete community post |
| `POST` | `/api/v1/community/posts/:postId/like` | Private | Like post |
| `DELETE` | `/api/v1/community/posts/:postId/like` | Private | Unlike post |
| `GET` | `/api/v1/community/posts/:postId/comments` | Public | Get comments for post |
| `POST` | `/api/v1/community/posts/:postId/comments` | Private | Comment on post |
| `DELETE` | `/api/v1/community/comments/:commentId` | Private (Author) | Delete comment |

### 11. Public Trip Sharing (`/api/v1/trips/:tripId/share`, `/api/v1/public/trips/:shareToken`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/trips/:tripId/share` | Private (Owner) | Enable sharing & generate 64-char crypto token |
| `DELETE` | `/api/v1/trips/:tripId/share` | Private (Owner) | Disable public sharing |
| `GET` | `/api/v1/public/trips/:shareToken` | Public | View read-only trip itinerary (No user private info) |
| `POST` | `/api/v1/public/trips/:shareToken/copy` | Private | Copy public trip to authenticated user account |

### 12. Notification System (`/api/v1/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Private | Get user notifications & check upcoming trip alerts |
| `PATCH` | `/api/v1/notifications/:id/read` | Private (Owner) | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Private | Mark all notifications as read |
| `DELETE` | `/api/v1/notifications/:id` | Private (Owner) | Delete notification |

### 13. Admin Module (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/users` | Private (Admin) | Paginated user management list |
| `GET` | `/api/v1/admin/users/:userId` | Private (Admin) | Detailed user breakdown |
| `PATCH` | `/api/v1/admin/users/:userId/status` | Private (Admin) | Update user status (`isActive`) or role |
| `DELETE` | `/api/v1/admin/users/:userId` | Private (Admin) | Delete user account |
| `GET` | `/api/v1/admin/statistics` | Private (Admin) | Get total system statistics metrics |
| `GET` | `/api/v1/admin/popular-cities` | Private (Admin) | Get top cities based on trip stops |
| `GET | `/api/v1/admin/popular-activities` | Private (Admin) | Get top activities based on trip activities |
| `GET` | `/api/v1/admin/user-trends` | Private (Admin) | Get signup & trip creation monthly trends |
