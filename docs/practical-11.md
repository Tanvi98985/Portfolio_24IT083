# Practical 11: Containerization with Docker and Docker Compose

## 1. Objective
The objective of this practical is to containerize the complete full-stack Task Management application (`portfolio_24IT083`) using **Docker** and orchestrate its multi-container architecture using **Docker Compose**.

Specifically:
- Create optimized Dockerfiles for both backend (Node.js/Express) and frontend (React/Vite).
- Implement a **multi-stage build** for the frontend to produce a lightweight production Nginx container.
- Configure **Nginx** with `try_files` to enable direct client-side routing and eliminate 404 errors on page refreshes.
- Compose a 3-tier microservice architecture:
  1. `frontend` (React + Vite served via Nginx on port `5173`)
  2. `backend` (Express 5 + Mongoose 9 REST API on port `5000`)
  3. `mongodb` (MongoDB 7 database engine on port `27017`)
- Connect all services through an isolated, private bridge network (`app-network`) enabling automatic container DNS resolution.
- Configure a named Docker volume (`mongo-data`) to guarantee data persistence across container restarts and terminations.
- Define container healthchecks and dependency conditions (`condition: service_healthy`) so services launch in correct sequential order without race conditions.
- Maintain existing local development workflows (`npm run dev:all`, MongoDB Atlas) without hardcoding secrets or modifying UI code.

---

## 2. Problem Statement & Motivation
Deploying modern web applications often suffers from the classic **"it works on my machine"** dilemma:
1. **Environment Discrepancies**: The developer might have Node.js 20 installed locally, while another teammate or server has Node.js 16 or 18, leading to runtime incompatibilities with modern packages (such as Mongoose 9 or Dotenv 17).
2. **Database Setup Overhead**: Running the application locally requires installing and configuring MongoDB locally or managing remote database credentials and firewall permissions.
3. **Complex Manual Startup**: Running the application requires opening multiple terminals: starting MongoDB, starting the Express backend, and running the Vite frontend server separately.
4. **Production Readiness**: Vite's development server is meant for rapid local hot-reloading, not high-performance production traffic. Production requires compiling static assets into optimized bundles and serving them via a high-performance web server like Nginx.

**Docker and Docker Compose solve these problems** by packaging application code, runtime libraries, and database services into standardized, portable, and isolated containers that start reproducibly with a single command: `docker compose up --build`.

---

## 3. Technologies Used
- **Docker**: Open-source platform for building, running, and managing containerized applications.
- **Docker Compose (v2)**: Tool for defining and running multi-container Docker applications via YAML.
- **Node.js 20 Alpine (`node:20-alpine`)**: Ultra-compact Linux base image (~50MB) containing Node.js 20 LTS runtime.
- **Nginx Alpine (`nginx:alpine`)**: High-performance HTTP server and reverse proxy used to serve static React production assets.
- **MongoDB 7 (`mongo:7`)**: NoSQL document database running in an isolated container.
- **React 18 & Vite**: Client-side single page application (SPA).
- **Express 5 & Mongoose 9**: Asynchronous backend REST API with EventEmitter and in-memory caching.

---

## 4. Multi-Container Architecture Diagram

The application is structured as three isolated containers communicating over an internal Docker bridge network (`app-network`), while exposing specific ports to the host machine:

```
HOST MACHINE (Developer / Browser / Postman)
  │
  ├── Port 5173 (HTTP) ──────────────────────────────────┐
  │                                                      │
  ├── Port 5000 (HTTP API) ────────┐                     │
  │                                │                     │
  └── Port 27017 (Optional DB)     │                     │
                                   │                     │
═══════════════════════════════════╪═════════════════════╪═════════════════════════════
DOCKER BRIDGE NETWORK: app-network │                     │
                                   ▼                     ▼
               ┌──────────────────────────────┐   ┌──────────────────────────────┐
               │    backend Container         │   │    frontend Container        │
               │    (Node 20 Express)         │   │    (Nginx Alpine)            │
               │    Port: 5000                │   │    Port: 5173                │
               │    Healthcheck: /api/health  │   │    Serves /dist bundle       │
               └──────────────┬───────────────┘   └──────────────────────────────┘
                              │
               Internal DNS:  │ mongodb:27017
                              ▼
               ┌──────────────────────────────┐
               │    mongodb Container         │
               │    (Mongo 7 Official)        │
               │    Port: 27017               │
               │    Healthcheck: mongosh ping │
               └──────────────┬───────────────┘
                              │ Mounts
                              ▼
               ┌──────────────────────────────┐
               │    Named Volume:             │
               │    mongo-data                │
               │    (/data/db)                │
               └──────────────────────────────┘
```

> **Crucial Networking Note**:
> - **Backend to Database**: Takes place *inside* the Docker network. The backend addresses the database using the container service name: `mongodb://mongodb:27017/tanvi_projects`.
> - **Browser to Backend**: Takes place *from the host machine's browser*. Because the browser runs outside the Docker bridge network on the user's host OS, the frontend's API base URL is configured to `http://localhost:5000` (the forwarded host port).

---

## 5. Files Created & Explained

### 5.1 `.dockerignore`
Prevents unnecessary, sensitive, or architecture-specific host files from entering the Docker build context:
```dockerignore
node_modules
.env
dist
.git
.github
docs
*.log
.DS_Store
!.env.example
```
- **Security**: Ensures actual `.env` credentials are never baked into container image layers.
- **Build Speed & Cache**: Eliminates copying hundreds of megabytes of local host `node_modules` or `.git` history into the Docker daemon.

### 5.2 `Dockerfile.backend`
Defines the container environment for the Express backend:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/server.js"]
```
- **`node:20-alpine`**: Uses Alpine Linux to keep the image size minimal (~180MB vs >1GB for standard Node).
- **`npm ci --omit=dev`**: Performs a clean, deterministic install of production dependencies directly inside Linux, avoiding any native binary incompatibilities with Windows host modules.
- **Layer Caching**: `package*.json` is copied and installed *before* copying `server/`. Code changes won't trigger re-installation of dependencies.

### 5.3 `Dockerfile.frontend` (Multi-Stage Build)
Uses a two-stage approach to separate the compile-time dependencies from the production runtime:
```dockerfile
# Stage 1: Build the React + Vite static bundle
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve compiled HTML/JS/CSS with Nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
```
- **Why Multi-Stage?**: Stage 1 contains Node.js, npm, Vite, and development build tools. Stage 2 discards all build tools and keeps only the compiled static assets inside a lightweight Nginx web server (~25MB), drastically reducing attack surface and image size.

### 5.4 `nginx.conf`
Nginx server configuration tailored for Single Page Applications (SPAs):
```nginx
server {
    listen 5173;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```
- **The SPA Routing Solution**: When a user navigates to `/tasks`, `/projects`, or `/contact` and refreshes the browser, Nginx looks for a physical directory named `/tasks`. Without `try_files $uri $uri/ /index.html;`, Nginx would return a `404 Not Found`. With `try_files`, Nginx falls back to `index.html`, allowing React Router to handle the route on the client.

### 5.5 `docker-compose.yml`
Coordinates the three microservices, network, and storage volumes:
- **`mongodb` service**: Pulls official `mongo:7`, mounts `mongo-data` volume to `/data/db`, exposes port `27017`, and runs a `mongosh ping` healthcheck.
- **`backend` service**: Builds `Dockerfile.backend`, injects environment variables (`MONGO_URI=mongodb://mongodb:27017/tanvi_projects`), waits for MongoDB to be healthy (`condition: service_healthy`), and monitors its own `/api/health` endpoint.
- **`frontend` service**: Builds `Dockerfile.frontend` with `VITE_API_BASE_URL=http://localhost:5000`, exposes port `5173`, and starts after the backend is verified healthy.
- **`mongo-data` volume**: Named volume stored on host Docker root, ensuring persistent records.
- **`app-network`**: User-defined bridge network providing automatic container name DNS resolution.

---

## 6. How to Run the Application with Docker

### Step 1: Verify Docker Installation
Open terminal and verify Docker engine and compose are available:
```bash
docker --version
docker compose version
```

### Step 2: Validate the Compose File
Check syntax and service resolution:
```bash
docker compose config
```

### Step 3: Start the Stack
Build images and start all three containers:
```bash
docker compose up --build
```
*(Or run in background with detached mode: `docker compose up --build -d`)*

### Step 4: Verify Running Containers
Check that all three containers are healthy and running:
```bash
docker compose ps
# or
docker ps
```
Expected output:
| Container Name | Service | Status | Ports |
|---|---|---|---|
| `mongodb_24it083` | `mongodb` | Up (healthy) | `0.0.0.0:27017->27017/tcp` |
| `backend_24it083` | `backend` | Up (healthy) | `0.0.0.0:5000->5000/tcp` |
| `frontend_24it083` | `frontend` | Up | `0.0.0.0:5173->5173/tcp` |

### Step 5: Access the Application
- **Frontend Application**: Open [http://localhost:5173](http://localhost:5173) in your web browser.
- **Backend Health Check**: Open [http://localhost:5000/api/health](http://localhost:5000/api/health).
  Response:
  ```json
  {
    "status": "ok",
    "message": "Task Manager API with JWT Auth is running"
  }
  ```

### Step 6: Stopping the Containers
- Stop containers and keep data:
  ```bash
  docker compose down
  ```
- Stop containers and delete database volume:
  ```bash
  docker compose down -v
  ```

---

## 7. Testing Guide & Verification of Data Persistence

### Phase 1: Register User & Create Initial Task
1. Navigate to `http://localhost:5173/tasks` in your browser.
2. Because the containerized MongoDB starts as a fresh isolated instance, register a new account:
   - **Email**: `docker_user@example.com`
   - **Password**: `dockerpass123`
3. Create a new task:
   - **Title**: `Docker Persistence Verification Task`
   - **Description**: `Testing MongoDB named volume retention`
4. Confirm the task renders in the UI and verify the backend terminal log shows cache invalidation and event completion:
   ```
   [API] Response sent at ...
   [Event] task-created handler STARTED at ...
   [Notification] Task "Docker Persistence Verification Task" created ...
   ```

### Phase 2: Verify Volume Persistence
1. Stop the Docker Compose stack:
   ```bash
   docker compose down
   ```
2. Verify all containers are stopped:
   ```bash
   docker ps
   # Should list 0 running containers
   ```
3. Restart the stack without rebuilding:
   ```bash
   docker compose up -d
   ```
4. Re-open [http://localhost:5173/tasks](http://localhost:5173/tasks) in your browser.
5. Log in with `docker_user@example.com` and `dockerpass123`.
6. **Result**: The task `"Docker Persistence Verification Task"` is still present!
7. **Conclusion**: Data persisted cleanly because `/data/db` is mounted to the host's named volume `mongo-data`.

---

## 8. Troubleshooting Common Issues

| Symptom / Error | Root Cause | Solution |
|---|---|---|
| **Backend cannot reach MongoDB (`ECONNREFUSED mongodb:27017`)** | Backend attempted connection before MongoDB initialized, or used `localhost` instead of service name. | 1. Ensure `MONGO_URI=mongodb://mongodb:27017/tanvi_projects` in `docker-compose.yml`.<br>2. Ensure `depends_on: mongodb: condition: service_healthy` is specified so backend waits for MongoDB ping. |
| **Port is already in use (`bind: address already in use: 5000` or `5173` or `27017`)** | A local Node server, local MongoDB service, or previous container is already occupying the port. | Stop the local process (`Stop-Service MongoDB` or kill running local node instances), or run `docker compose down`. |
| **Slow build times / Docker build hangs** | Host `node_modules` or `.git` folder is being copied into the Docker build context. | Verify `.dockerignore` exists in root and contains `node_modules`, `.git`, and `dist`. |
| **Code changes not reflected in container** | Containers run compiled static assets or pre-installed image layers. | Rebuild the container images using `docker compose up --build`. |
| **Frontend 404 on page refresh (`/tasks`)** | Nginx cannot find physical route file on disk. | Ensure `nginx.conf` contains `try_files $uri $uri/ /index.html;` so all SPA routes route to `index.html`. |

---

## 9. Key Questions & Answers

### Q1. Why must the backend use the service name `mongodb` instead of `localhost`?
**Answer**:
Each Docker container operates in its own isolated network namespace with its own loopback interface (`localhost` / `127.0.0.1`). If the backend container attempts to connect to `mongodb://localhost:27017`, it is querying its *own* container, where no MongoDB daemon is running. 

Inside a Docker Compose user-defined bridge network (`app-network`), Docker runs an embedded DNS server (at `127.0.0.11`) that resolves container service names directly to their assigned private IP addresses. Therefore, the backend must use the service name `mongodb` (`mongodb://mongodb:27017/tanvi_projects`) to route packets across the bridge network to the MongoDB container.

### Q2. What is the difference between `EXPOSE` in a Dockerfile and `ports` in `docker-compose.yml`?
**Answer**:
- **`EXPOSE` (Dockerfile)**: Serves as internal metadata and documentation. It declares that the container's process listens on a specific port, but **it does not publish or bind the port to the host machine**. Containers on the same bridge network can communicate through exposed ports, but the port remains unreachable from outside Docker (the host).
- **`ports` (docker-compose.yml)**: Actually forwards and binds the host port to the container port (format `HOST:CONTAINER`, e.g., `"5000:5000"`). It creates a firewall routing rule that maps traffic from `http://localhost:5000` on the physical machine into the container's port 5000.

### Q3. Why is copying `node_modules` into an image a bad practice?
**Answer**:
1. **Host-Specific Platform Mismatch**: Many npm packages (e.g., `bcrypt`, `esbuild`, or native bindings) compile platform-dependent C++ binary artifacts during installation. If the host machine runs Windows x64 or macOS ARM and copies its `node_modules` into a Linux Alpine container (`node:20-alpine`), the binaries will fail to execute with architecture errors (e.g., `invalid ELF header`).
2. **Massive Image Bloat & Slow Builds**: Host `node_modules` can contain tens of thousands of files totaling several hundred megabytes. Copying them across the Docker daemon socket drastically increases build time and consumes gigabytes of cache storage.
3. **Reproducibility**: Running `npm ci` directly inside the container guarantees a clean, deterministic installation based strictly on `package-lock.json` tailored specifically for the container's Linux operating system.

### Q4. Why was a multi-stage build used for the frontend?
**Answer**:
A multi-stage build splits the container creation process into two distinct environments:
- **Build Stage (`node:20-alpine`)**: Contains Node.js, npm, package sources, devDependencies (Vite, Babel, JSX plugins), and source files. It executes `npm run build` to generate the compiled, minified bundle in `/dist`.
- **Production Stage (`nginx:alpine`)**: Copies *only* the compiled `/dist` static assets and our custom `nginx.conf` into an Nginx image. All of Node.js, npm, node_modules, and source code are discarded.

**Image Size Comparison**:
- Frontend build stage alone (Node + devDependencies): **~450 MB - 600 MB**
- Final multi-stage Nginx production container: **~25 MB - 35 MB**
*(Achieves >90% reduction in image size, drastically reduces container startup time, and eliminates runtime vulnerabilities since Node.js is not present in production).*

### Q5. Why Node 20 instead of Node 18?
**Answer**:
Our application uses **Mongoose 9** (`^9.9.3`) and **Dotenv 17** (`^17.4.2`). 
- Starting with Mongoose 9, the minimum supported runtime is **Node.js 20+** (utilizing updated V8 engine ECMAScript features and modern Promise/stream APIs). Running Mongoose 9 on Node 18 produces compatibility warnings or runtime errors.
- Node 20 is the current Active LTS (Long Term Support) release, providing modern Fetch API support, security patches, and optimal performance on Alpine Linux.

---

## 10. Screenshots List / Verification Proofs

When preparing the lab submission, include the following screenshots:
1. `p11-docker-version.png`: Terminal output of `docker --version` and `docker compose version`.
2. `p11-compose-up.png`: Terminal logs during `docker compose up --build` showing successful image compilation and container creation.
3. `p11-docker-ps.png`: Output of `docker compose ps` displaying all 3 containers (`mongodb_24it083`, `backend_24it083`, `frontend_24it083`) in `Up (healthy)` state.
4. `p11-health-api.png`: Browser / Postman view of `http://localhost:5000/api/health` returning `{ "status": "ok" }`.
5. `p11-app-browser.png`: Browser view of `http://localhost:5173/tasks` displaying registered user tasks loaded from containerized MongoDB.
6. `p11-persistence.png`: Proof of data persistence showing tasks preserved after running `docker compose down` followed by `docker compose up -d`.
7. `p11-image-sizes.png`: Terminal output of `docker images` showing the lightweight footprints of the built images (especially the multi-stage frontend).

---

## 11. Supplementary Real-World Practices

1. **Non-Root User for Security**: In production environments, running containers as `root` is discouraged. Adding `USER node` before `CMD` prevents potential container breakout vulnerabilities.
2. **Docker Compose Profiles**: Development versus production configurations can be cleanly separated using compose override files (`docker-compose.override.yml`) or profiles (e.g., mounting local source code with volumes during development for hot-reloading).
3. **Secret Management**: For enterprise production deployments, sensitive keys (`JWT_SECRET`, database passwords) should be injected via Docker Secrets, AWS Secrets Manager, or HashiCorp Vault rather than plain environment variables.

---

## 12. Conclusion
In Practical 11, the full-stack Task Management application was successfully containerized. Using **multi-stage Docker builds**, the frontend was compiled into an ultra-slim **Nginx** container with SPA route fallback, while the backend was encapsulated in a clean **Node 20 Alpine** environment. **Docker Compose** orchestrates all three tiers (frontend, backend, and MongoDB 7) over an isolated bridge network with healthchecks, and a named volume ensures full data persistence. The entire microservice stack can now be deployed reproducibly on any system with a single command.
