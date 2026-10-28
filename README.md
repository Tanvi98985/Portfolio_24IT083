# Portfolio_24IT083

A personal portfolio website built with React and Vite to showcase my projects, skills, and contact information. The application also integrates the GitHub REST API to dynamically display my public repositories.

---

## Features

- Responsive portfolio website
- Multi-page navigation using React Router
- Reusable React components
- Dynamic GitHub repository listing
- Search repositories by name
- Loading spinner while fetching data
- Error handling with retry option
- Displays repository name, repository link, and star count
- Clean and modern user interface

---

## Technologies Used

- React
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3
- React Router
- GitHub REST API

---

## GitHub API

The application fetches public repositories using the GitHub REST API.

**API Endpoint**

```
https://api.github.com/users/Tanvi98985/repos
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd Portfolio_24IT083
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```
http://localhost:5173
```

---

## Run with Docker

The entire full-stack application (React frontend, Node.js backend, and MongoDB database) can be launched simultaneously using Docker Compose with zero manual setup.

### Prerequisites
- Docker Engine installed:
  ```bash
  docker --version
  ```
- Docker Compose v2 installed:
  ```bash
  docker compose version
  ```

### Quick Start
Build and start all 3 services in the background:
```bash
docker compose up --build
```
Or in detached mode:
```bash
docker compose up --build -d
```

### Application URLs
- **Frontend (React UI via Nginx)**: [http://localhost:5173](http://localhost:5173)
- **Backend Healthcheck API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Backend Tasks API**: [http://localhost:5000/tasks](http://localhost:5000/tasks)

### Stopping Containers
Stop all running services without deleting database records:
```bash
docker compose down
```

### Reset / Wipe Database Volume
Stop all services and completely wipe persistent MongoDB storage:
```bash
docker compose down -v
```

---

## Project Structure

```
src
│── components
│   ├── About.jsx
│   ├── ErrorMessage.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── NavBar.jsx
│   ├── ProjectCard.jsx
│   ├── Skills.jsx
│   └── Spinner.jsx
│
│── pages
│   ├── Contact.jsx
│   ├── Home.jsx
│   ├── NotFound.jsx
│   └── Projects.jsx
│
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

---

## Practical Documentation

- [Practical 8: Route-Based Lazy Loading & Performance Optimization](docs/practical-8.md)
- [Practical 9: In-Memory Caching and Query Optimization](docs/practical-9.md)
- [Practical 10: Asynchronous Processing with Event-Driven Architecture](docs/practical-10.md)
- [Practical 11: Containerization with Docker and Docker Compose](docs/practical-11.md)

### Practical 11 Features Added:
- **Full-Stack Containerization**: Dockerized React (Vite/Nginx), Node.js (Express), and MongoDB 7 into isolated microservices.
- **Multi-Stage Frontend Build**: Minimized image size using `node:20-alpine` build stage and slim `nginx:alpine` production server.
- **Nginx SPA Routing**: Custom `nginx.conf` utilizing `try_files $uri /index.html;` to ensure direct browser refresh works across all React Router routes.
- **Inter-Service DNS Networking**: Private bridge network (`app-network`) allowing backend to reliably connect to `mongodb://mongodb:27017/tanvi_projects`.
- **Persistent Storage**: Named volume (`mongo-data`) protecting database records across container stops and restarts.
- **Container Healthchecks**: Configured health probes (`mongosh ping` and `wget /api/health`) enforcing strict startup order via `condition: service_healthy`.

### Practical 10 Features Added:
- **Node.js EventEmitter**: Native publish-subscribe event-driven architecture using built-in `events` module.
- **Asynchronous Decoupling**: API responses return immediately to the client without waiting for long-running notification or audit processes.
- **Task Domain Events**: Dedicated listeners for `task-created`, `task-deleted`, and `error`.
- **User Association**: Resolves user email from MongoDB asynchronously during notification delivery.
- **Simulated Notification Delay**: Configurable `NOTIFICATION_DELAY_MS` (default 2000 ms) showcasing background non-blocking execution.
- **Sync vs Async Comparison**: `?mode=sync` testing mode demonstrating an 88x latency improvement (~23 ms vs ~2028 ms).
- **Error Resilience**: Catches and forwards event errors so unhandled errors never crash the Node.js server (verified via `FAIL_NOTIFY`).

### Practical 9 Features Added:
- **node-cache**: Server-side in-memory caching engine.
- **60-second TTL**: Automatic time-to-live expiration for cached tasks.
- **User-Specific Caching**: Isolated cache keys (`all_tasks_${userId}`) ensuring full user privacy.
- **Single-Task Caching**: Cached individual task lookup (`GET /tasks/:id`) with key `task_${userId}_${taskId}`.
- **Cache Invalidation**: Automatic cache deletion upon `POST`, `PUT`, and `DELETE` writes after successful database operations.
- **Cache Hit/Miss Counter**: In-memory counters tracking cache efficiency.
- **Cache Statistics Endpoint**: Protected debug endpoint `GET /tasks/cache/stats`.
- **Performance Testing**: Measured cached vs. uncached API latency.

---

## Author

**Tanvi Ramani**

B.Tech Information Technology

CHARUSAT University