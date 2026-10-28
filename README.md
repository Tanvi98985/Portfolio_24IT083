# Portfolio_24IT083

![CI Pipeline](https://github.com/Tanvi98985/Portfolio_24IT083/actions/workflows/ci.yml/badge.svg)

A full-stack portfolio and task management project built with React, Vite, Express, and MongoDB. The repository combines a personal portfolio website with a protected task manager that demonstrates authentication, database access, API design, caching, asynchronous processing, and Docker-based deployment.

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features Implemented](#main-features-implemented)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Frontend and Backend URLs](#frontend-and-backend-urls)
- [API Documentation](#api-documentation)
- [Database Configuration](#database-configuration)
- [Authentication and Security](#authentication-and-security)
- [Testing and Verification](#testing-and-verification)
- [CI/CD Pipeline](#cicd-pipeline)
- [Practical Evidence and Documentation](#practical-evidence-and-documentation)
- [Practical Progress (1-12)](#practical-progress-1-12)
- [Practical 13](#practical-13)
- [Known Limitations and Future Improvements](#known-limitations-and-future-improvements)
- [Author](#author)

---

## Project Overview

This project is a combined web application developed as a portfolio website and a task management system for Advanced Web Development Frameworks practicals. It includes:

- a responsive personal portfolio built with React and Vite
- GitHub repository data integration through the GitHub REST API
- a protected task manager with user registration and login
- JWT-based authentication and protected CRUD APIs
- MongoDB persistence for users and tasks
- server-side caching for repeated read operations
- event-driven asynchronous processing for task lifecycle events
- Docker and Docker Compose setup for containerized deployment

The source code in the repository is the authoritative source of the implemented features. Practical documentation is available in [docs/](docs/), including [docs/practical-8.md](docs/practical-8.md), [docs/practical-9.md](docs/practical-9.md), [docs/practical-10.md](docs/practical-10.md), and [docs/practical-11.md](docs/practical-11.md).

---

## Main Features Implemented

### Portfolio features

- Responsive portfolio layout and styling
- Multi-page navigation using React Router
- About, projects, home, contact, and 404 pages
- Dynamic GitHub repository listing through the GitHub REST API
- Search and loading/error states during data retrieval
- Reusable UI components for cards, headers, footer, and navigation

### Task management features

- User registration and login
- Password hashing using bcryptjs
- JWT authentication with bearer tokens
- CRUD endpoints for tasks
- Task completion toggle and delete confirmation flows
- Protected routes and user-specific data access
- Cache hit/miss tracking for performance analysis
- Event-driven notification simulation for task lifecycle events
- Dockerized frontend, backend, and MongoDB services

---

## Technology Stack

| Technology              | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| React 18                | Frontend user interface and component-driven portfolio design |
| Vite                    | Fast frontend build and development tooling                   |
| React Router            | Client-side routing across portfolio and task manager pages   |
| Express 5               | API server for backend routes                                 |
| Node.js 20              | JavaScript runtime for the server                             |
| MongoDB + Mongoose 9    | NoSQL database and ODM for users and tasks                    |
| JWT                     | Authentication and authorization for protected routes         |
| bcryptjs                | Password hashing for secure user storage                      |
| node-cache              | In-memory data cache for repeated read operations             |
| EventEmitter            | Asynchronous task lifecycle event handling                    |
| CORS                    | Cross-origin sharing for frontend-backend communication       |
| Docker + Docker Compose | Containerized orchestration for full-stack deployment         |
| Nginx                   | Production serving for the frontend static bundle             |
| dotenv                  | Environment variable loading                                  |
| GitHub REST API         | Fetching public repository data for the portfolio             |

---

## Project Structure

```text
portfolio_24IT083/
├── .dockerignore
├── .env.example
├── Dockerfile.backend
├── Dockerfile.frontend
├── README.md
├── docker-compose.yml
├── index.html
├── nginx.conf
├── package.json
├── vite.config.js
├── docs/
│   ├── practical-8.md
│   ├── practical-9.md
│   ├── practical-10.md
│   └── practical-11.md
├── server/
│   ├── cache.js
│   ├── db.js
│   ├── events.js
│   ├── listeners.js
│   ├── server.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Task.js
│   │   └── User.js
│   └── routes/
│       ├── authRoutes.js
│       └── taskRoutes.js
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── api.js
│   ├── index.css
│   ├── main.jsx
│   ├── components/
│   │   ├── About.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   ├── NavBar.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── Skills.jsx
│   │   ├── Spinner.jsx
│   │   └── Toast.jsx
│   └── pages/
│       ├── Contact.jsx
│       ├── Home.jsx
│       ├── NotFound.jsx
│       ├── Projects.jsx
│       └── TaskManager.jsx
├── dist/                     # generated by Vite build
└── node_modules/             # installed dependencies
```

---

## System Architecture

The project follows a three-layer architecture:

```text
Browser / User
     |
     v
React Frontend (Vite + React Router)
     |
     | HTTP requests
     v
Express Backend (Node.js + JWT auth + API routes)
     |
     +--> MongoDB (users, tasks)
     +--> In-memory cache (node-cache)
     +--> Event emitter listeners (task-created, task-deleted)
```

### Frontend to backend workflow

1. The React frontend loads the portfolio and task manager pages.
2. The task manager sends login and registration requests to the `/auth` endpoints.
3. Successful login stores a JWT in localStorage and sends the token with further API calls.
4. Protected task requests are made to `/tasks` on the backend.
5. The backend validates the JWT, reads or writes data in MongoDB, and returns JSON responses.

### Backend to database workflow

- [server/db.js](server/db.js) establishes the MongoDB connection using `MONGO_URI` or a local fallback.
- [server/models/User.js](server/models/User.js) stores user records in the `users` collection.
- [server/models/Task.js](server/models/Task.js) stores task records in the `tasks` collection.
- Both collections are part of the `tanvi_projects` database used in this project.

---

## Prerequisites

Before running locally, ensure the following are installed:

- Node.js 20+
- npm
- MongoDB locally or access to a MongoDB Atlas cluster
- Docker Desktop for containerized use
- Git

For Windows PowerShell, commands can be run from the project root directly.

---

## Environment Setup

The project includes [.env.example](.env.example). Create a local `.env` file in the project root using it as a template.

Example structure:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tanvi_projects
DB_NAME=tanvi_projects
JWT_SECRET=your_jwt_secret_key_here
NOTIFICATION_DELAY_MS=2000
```

Important notes:

- Never commit the real `.env` file.
- The repository includes [.dockerignore](.dockerignore), which excludes `.env` from Docker image builds.
- In Docker Compose, the backend internally connects to MongoDB using `mongodb://mongodb:27017/tanvi_projects`.

---

## Local Development Setup

From the project root, install dependencies and run the app:

```powershell
cd "E:\5th sem\AWDF\portfolio_24IT083"
npm install
npm run dev
```

This starts the Vite frontend development server.

To run the frontend and backend together:

```powershell
cd "E:\5th sem\AWDF\portfolio_24IT083"
npm install
npm run dev:all
```

This launches both:

- frontend: http://localhost:5173
- backend: http://localhost:5000

If you want to run only the backend server:

```powershell
cd "E:\5th sem\AWDF\portfolio_24IT083"
npm run server
```

---

## Docker Setup

Docker configuration is present in the project root:

- [Dockerfile.backend](Dockerfile.backend)
- [Dockerfile.frontend](Dockerfile.frontend)
- [docker-compose.yml](docker-compose.yml)
- [nginx.conf](nginx.conf)
- [.dockerignore](.dockerignore)

### Docker architecture

This project uses:

- React/Vite frontend built in a multi-stage Docker build
- Nginx to serve the production frontend bundle on port 5173
- Node.js/Express backend on port 5000
- MongoDB 7 official image on port 27017
- Docker bridge network named `app-network`
- Named volume `mongo-data_24it083` for database persistence

### Docker Compose configuration summary

From [docker-compose.yml](docker-compose.yml):

- `mongodb` service uses `mongo:7`
- `backend` service uses `Dockerfile.backend`
- `frontend` service uses `Dockerfile.frontend`
- `backend` connects to MongoDB via `mongodb://mongodb:27017/tanvi_projects`
- `frontend` exposes port `5173:5173`
- `backend` exposes port `5000:5000`
- `mongodb` exposes port `27017:27017`

### Build and start with Docker Compose

```powershell
cd "E:\5th sem\AWDF\portfolio_24IT083"
docker compose up --build
```

This builds and starts all three services.

### Stop and restart services

```powershell
docker compose down
docker compose up --build
docker compose down -v
```

The `down -v` option removes the named volume and resets the database data.

---

## Frontend and Backend URLs

- Frontend URL: http://localhost:5173
- Backend health endpoint: http://localhost:5000/api/health
- Backend API base URL: http://localhost:5000

---

## API Documentation

The API is implemented in the backend routes and is protected by JWT middleware unless otherwise noted.

### Authentication routes

| Method | Route            | Description                       |
| ------ | ---------------- | --------------------------------- |
| POST   | `/auth/register` | Register a new user               |
| POST   | `/register`      | Root-level alias for registration |
| POST   | `/auth/login`    | Login and return JWT              |
| POST   | `/login`         | Root-level alias for login        |
| GET    | `/auth/me`       | Get current authenticated user    |
| GET    | `/me`            | Root-level alias for current user |

### Task routes

| Method | Route                | Description                                |
| ------ | -------------------- | ------------------------------------------ |
| GET    | `/tasks`             | Fetch all tasks for the authenticated user |
| GET    | `/tasks/:id`         | Fetch one task by ID                       |
| POST   | `/tasks`             | Create a new task                          |
| PUT    | `/tasks/:id`         | Update task fields                         |
| DELETE | `/tasks/:id`         | Delete a task                              |
| GET    | `/tasks/cache/stats` | View in-memory cache hit/miss stats        |

### Health check

| Method | Route         | Description                           |
| ------ | ------------- | ------------------------------------- |
| GET    | `/api/health` | Health check endpoint for the backend |

Actual route definitions are in [server/server.js](server/server.js), with implementation in [server/routes/authRoutes.js](server/routes/authRoutes.js) and [server/routes/taskRoutes.js](server/routes/taskRoutes.js).

---

## Database Configuration

The project uses MongoDB with Mongoose.

### Local development

The default local connection is:

```env
MONGO_URI=mongodb://127.0.0.1:27017/tanvi_projects
```

The database name is `tanvi_projects`.

### Docker Compose

Inside the Docker network, the backend connects to the MongoDB service using:

```env
MONGO_URI=mongodb://mongodb:27017/tanvi_projects
```

### Persistence

The Compose file defines a named Docker volume:

```yaml
volumes:
  mongo-data:
    name: mongo-data_24it083
```

This persists MongoDB data under `/data/db` across container restarts.

### Collections used

- `users` — stores registered user records
- `tasks` — stores user task documents

The schemas are defined in [server/models/User.js](server/models/User.js) and [server/models/Task.js](server/models/Task.js).

---

## Authentication and Security

Authentication is implemented with JWT and bcrypt.

### Security features

- password hashing with `bcryptjs`
- secure JWT signing using `JWT_SECRET`
- protected task routes via `authMiddleware`
- validation checks before creating users or tasks
- bearer token usage for authenticated requests
- 401 responses for invalid, expired, or malformed tokens

### Validation logic

The middleware in [server/middleware/validate.js](server/middleware/validate.js) validates:

- email format
- minimum password length
- required task title values
- invalid or empty task data

---

## Testing and Verification

The repository includes both automated integration testing and manual verification workflows.

### Automated Testing (Jest & Supertest)

Run the automated in-memory integration test suite locally:

```bash
npm test
```

The test suite in [server/tests/api.test.js](server/tests/api.test.js) validates:

- `GET /api/health` returns status 200 with `{ "status": "ok" }`
- `GET /tasks` without authorization returns 401 Unauthorized
- `GET /tasks` with an invalid/tampered token returns 401 Unauthorized
- `GET /tasks/cache/stats` with a valid JWT returns 200 with numeric hit/miss metrics
- `GET /unknown-route` returns 404 Route not found

Tests execute entirely in-memory without requiring a live MongoDB instance or internet connection.

### Local verification

1. Start backend and frontend:

```powershell
npm run dev:all
```

2. Open the frontend at http://localhost:5173
3. Register a user and log in
4. Create a task and confirm it appears in the task list
5. Toggle completion, delete a task, and confirm cache invalidation logs in the backend console
6. Check the health endpoint at http://localhost:5000/api/health

### Docker verification

```powershell
docker compose up --build
```

Then confirm:

- frontend is reachable on http://localhost:5173
- backend is reachable on http://localhost:5000/api/health
- MongoDB accepts connections and the named volume is mounted

### Cache verification

Use the protected endpoint:

```text
GET /tasks/cache/stats
```

This returns hit/miss values for the in-memory cache layer.

---

## CI/CD Pipeline

The project implements a continuous integration (CI) pipeline using **GitHub Actions** defined in [.github/workflows/ci.yml](.github/workflows/ci.yml).

### Workflow Triggers & Jobs

- **Trigger**: Every `push` to the `main` branch.
- **Runner**: `ubuntu-latest`
- **Node Runtime**: Node.js 20 LTS (required for Mongoose 9 and Dotenv 17)
- **Pipeline Steps**:
  1. **Checkout Code**: Retrieves the repository source using `actions/checkout@v4`.
  2. **Set up Node.js**: Installs Node 20 using `actions/setup-node@v4`.
  3. **Install Dependencies**: Executes `npm install` across frontend and backend modules.
  4. **Run Automated Tests**: Executes `npm test` with in-memory JWT credentials (`JWT_SECRET=test_secret`).
  5. **Build Frontend**: Compiles production React assets via `npm run build` using Vite.

### Running Tests Locally

Before pushing code, run tests locally using:

```bash
npm test
```

---

## Practical Evidence and Documentation

The repository contains practical documentation files in [docs/](docs/):

- [docs/practical-8.md](docs/practical-8.md) — route-based lazy loading and performance optimization
- [docs/practical-9.md](docs/practical-9.md) — in-memory caching and query optimization
- [docs/practical-10.md](docs/practical-10.md) — event-driven asynchronous processing
- [docs/practical-11.md](docs/practical-11.md) — Docker and Docker Compose containerization
- [docs/practical-12.md](docs/practical-12.md) — CI/CD Pipeline with GitHub Actions

No image files such as `.png`, `.jpg`, or `.svg` were found under [docs/](docs/). The practical evidence in this repository is therefore represented by the Markdown documentation files rather than screenshot assets.

---

## Practical Progress (1-12)

The repository contains direct evidence for the later practicals and a complete combined application that reflects the integrated project progression.

| Practical | Evidence in repository                                | Status                                                     |
| --------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| 1         | Portfolio foundation and front-end structure          | Implemented in source code                                 |
| 2         | React app structure and component-based UI            | Implemented in source code                                 |
| 3         | Multi-page navigation and portfolio sections          | Implemented in source code                                 |
| 4         | API integration and project data fetching             | Implemented in source code                                 |
| 5         | Task management UI foundation                         | Implemented in source code                                 |
| 6         | CRUD workflow and frontend state logic                | Implemented in source code                                 |
| 7         | Backend integration and task persistence foundation   | Implemented in source code                                 |
| 8         | Route-based lazy loading and performance optimization | Documented in [docs/practical-8.md](docs/practical-8.md)   |
| 9         | In-memory caching and query optimization              | Documented in [docs/practical-9.md](docs/practical-9.md)   |
| 10        | Event-driven asynchronous processing                  | Documented in [docs/practical-10.md](docs/practical-10.md) |
| 11        | Docker and Docker Compose deployment                  | Documented in [docs/practical-11.md](docs/practical-11.md) |
| 12        | CI/CD Pipeline with GitHub Actions                    | Documented in [docs/practical-12.md](docs/practical-12.md) |

This project therefore represents the combined result of multi-practical full-stack development, with practicals 8–12 documented in the repository.

---

## Practical 13

Practical 13 is not evidenced in the repository as an implemented or documented artifact at the current time.

The project contains direct implementation and documentation evidence up to Practical 12. No dedicated `practical-13` files or implementation markers were found in the source tree.

---

## Known Limitations and Future Improvements

- The application uses a single local in-memory cache instance, which is suitable for single-node deployments but not for horizontal scaling across multiple backend instances.
- The backend uses the Node.js event system for notification simulation; production systems would typically use external queues or message brokers.
- Frontend and backend default to localhost URLs; environment-specific deployment may require additional configuration.
- The project is educational and practical-focused rather than a production-grade enterprise system.
- Earlier practical stages are evident in the combined codebase but are not fully isolated into separate markdown docs for each numbered practical.

Potential future improvements:

- add automated testing with Vitest or Jest
- add pagination and filtering for tasks
- add user profile management
- improve Docker health checks and CI/CD automation
- add Redis for distributed caching in production deployments
- add real email or notification backend integration

---

## Author

**Tanvi Ramani**

B.Tech Information Technology

CHARUSAT University
