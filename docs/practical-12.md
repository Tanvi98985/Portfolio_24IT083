# Practical 12: CI/CD Pipeline with GitHub Actions

## 1. Objective
The objective of this practical is to implement an automated **Continuous Integration (CI)** pipeline for the full-stack Task Management application (`portfolio_24IT083`) using **GitHub Actions**.

Specifically:
- Refactor the backend server entrypoint (`server/server.js`) so that database connections and socket listeners are bypassed when running in `NODE_ENV=test`, allowing fast, non-blocking in-memory execution.
- Implement an automated integration test suite using **Jest** and **Supertest** supporting native ES Modules via `--experimental-vm-modules`.
- Configure tests that run entirely in-memory without requiring live MongoDB Atlas or internet access.
- Create a GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on pushes to `main`.
- Automate code checkout, Node.js 20 environment setup, dependency installation (`npm install`), automated test execution (`npm test`), and frontend production build verification (`npm run build`).
- Demonstrate the CI feedback loop: passing pipeline (green tick), deliberate test failure detection (red X), and subsequent fix.
- Display the live workflow status badge in `README.md`.

---

## 2. Problem Statement & Motivation
In collaborative software development, integrating code changes manually introduces critical risks:
1. **Regression Errors**: A change in the backend API or middleware can silently break existing endpoints without the developer realizing it.
2. **Broken Builds on Main**: Developers might push changes that pass on their machine but fail to build or compile on a clean machine due to missing dependencies or platform differences.
3. **Slow Feedback Cycles**: Discovering bugs days or weeks later during pre-release manual QA makes debugging expensive and time-consuming.

**Continuous Integration (CI)** automates quality checks on every commit. As soon as code is pushed to GitHub, an isolated virtual runner checks out the repository, installs dependencies, runs automated tests, and verifies the frontend build. If any step fails, the pipeline fails immediately, alerting the team before broken code reaches production.

---

## 3. Technologies Used
- **GitHub Actions**: Cloud-native CI/CD orchestration platform integrated directly into GitHub.
- **Node.js 20 LTS**: Modern JavaScript runtime (required for Mongoose 9 and Dotenv 17).
- **Jest**: Comprehensive JavaScript testing framework configured for Node.js ES Modules.
- **Supertest**: HTTP assertion library allowing programmatic testing of Express endpoints without opening network ports.
- **Vite**: Frontend build engine compiling static React assets during the CI build stage.
- **JSON Web Token (jsonwebtoken)**: Programmatically generating valid test tokens for protected endpoint verification.

---

## 4. CI Pipeline Architecture Diagram

The flowchart below illustrates the execution of the GitHub Actions pipeline upon every push to the repository:

```
Developer Push (git push origin main)
         │
         ▼
┌────────────────────────────────────────────────────────┐
│             GitHub Actions (ubuntu-latest)             │
│                 Job: build-and-test                    │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 1: actions/checkout@v4                           │
│  Clones repository source code into virtual runner     │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 2: actions/setup-node@v4                         │
│  Installs Node.js 20 LTS runtime environment           │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 3: npm install                                   │
│  Installs root, server, and devDependencies            │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 4: npm test (JWT_SECRET=test_secret)             │
│  Executes Jest + Supertest in-memory API test suite    │
└────────────┬───────────────────────────────┬───────────┘
             │                               │
       Tests Pass                      Test Fails
             │                               │
             ▼                               ▼
┌────────────────────────┐      ┌────────────────────────┐
│  Step 5: npm run build │      │ Pipeline STOPS         │
│  Compiles Vite assets  │      │ GitHub shows RED ❌    │
└────────────┬───────────┘      │ Email alert sent       │
             │                  └────────────────────────┘
       Build Passes
             │
             ▼
┌────────────────────────┐
│ Job Complete!          │
│ GitHub shows GREEN ✔️  │
│ Badge: Passing         │
└────────────────────────┘
```

---

## 5. Files Created and Modified

| File | Status | Description |
|---|---|---|
| `server/server.js` | **Modified** | Wrapped `connectDB()` and `app.listen()` inside `if (process.env.NODE_ENV !== 'test')` to prevent opening MongoDB sockets during tests. |
| `package.json` | **Modified** | Added `"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"` and Jest configuration for ESM. |
| `server/tests/api.test.js` | **Created** | Automated test suite validating `/api/health`, `/tasks` 401 auth checks, `/tasks/cache/stats` token verification, and 404 handler. |
| `.github/workflows/ci.yml` | **Created** | GitHub Actions CI pipeline executing on push to `main` with 5 automated steps. |
| `.dockerignore` | **Modified** | Added `server/tests` so automated test files are excluded from backend Docker production containers. |
| `README.md` | **Modified** | Added CI badge, documented the CI/CD pipeline, and linked `docs/practical-12.md`. |

---

## 6. Why Tests Need No Database or Internet

In traditional production execution, `server.js` connects to MongoDB Atlas or local MongoDB via Mongoose. In CI, connecting to external databases introduces major issues:
- **Flaky Tests**: Network latency, ISP issues, or Atlas IP whitelist restrictions can cause false-positive test failures.
- **Security Hazards**: Exposing live database credentials in CI environment variables creates leak risks.
- **Side Effects**: Tests creating or deleting tasks in a shared database could corrupt real user data.

### How Our Tests Run Without a Database:
1. **Conditional Initialization**: Wrapping `connectDB()` in `if (process.env.NODE_ENV !== 'test')` ensures Mongoose never attempts to initiate a network socket connection.
2. **In-Memory Supertest**: Supertest binds directly to the Express `app` object in-memory using Node's internal `http.createServer()` without binding to a physical TCP port.
3. **Stateless Authentication**: JWT verification in `authMiddleware` is cryptographic. It validates tokens mathematically using `process.env.JWT_SECRET = 'test_secret'` without querying a database.
4. **Cache Testing**: The `/tasks/cache/stats` endpoint queries the in-memory `node-cache` stats counter in RAM, requiring zero database interaction.

---

## 7. Automated Test Suite Specification

The test suite in [server/tests/api.test.js](file:///e:/5th%20sem/AWDF/portfolio_24IT083/server/tests/api.test.js) includes 5 real tests that assert specific HTTP contracts:

| # | Test Description | Target Route | Expected Status | Assertion Criteria | Database Needed? |
|---|---|---|---|---|---|
| **1** | Health Check API | `GET /api/health` | `200 OK` | `res.body.status === 'ok'`, `message` contains `'running'` | No |
| **2** | Missing Token Auth Check | `GET /tasks` | `401 Unauthorized` | `res.body.error` is defined (missing Bearer token) | No |
| **3** | Tampered Token Auth Check | `GET /tasks` | `401 Unauthorized` | Header: `Bearer invalidtoken`, `res.body.error` is defined | No |
| **4** | Cache Stats with Valid JWT | `GET /tasks/cache/stats` | `200 OK` | Header: valid JWT, `typeof hits === 'number'`, `typeof misses === 'number'` | No |
| **5** | Route Not Found Handler | `GET /unknown-route` | `404 Not Found` | `res.body.error` is defined | No |

---

## 8. Step-by-Step CI Demonstration

To verify that the CI pipeline detects broken code and enforces quality gates, the following 3-step demonstration is performed:

```
[Step A: Push Passing Code] ──> GitHub Actions: GREEN ✔️
               │
[Step B: Break Health Test] ──> GitHub Actions: RED ❌ (Assertion Failure)
               │
[Step C: Fix Health Test]   ──> GitHub Actions: GREEN ✔️ (Recovered)
```

### Step A: Push Working Workflow & Tests
1. Stage and commit workflow, test suite, and configuration:
   ```bash
   git add .
   git commit -m "ci: add GitHub Actions workflow for install, test and build"
   git push origin main
   ```
2. Navigate to the repository's **Actions** tab on GitHub: `https://github.com/Tanvi98985/Portfolio_24IT083/actions`.
3. The workflow `CI Pipeline` runs automatically.
4. All steps complete successfully with a green checkmark (**Passed**):
   - Checkout code ✔️
   - Set up Node.js 20 ✔️
   - Install dependencies ✔️
   - Run automated tests ✔️
   - Build frontend ✔️

### Step B: Deliberate Test Failure (The Red Run)
1. In `server/tests/api.test.js`, intentionally change the expected status code in Test 1 from `200` to `201`:
   ```javascript
   // Deliberately broken expectation:
   it('GET /api/health returns 200 and status ok', async () => {
     const res = await request(app).get('/api/health');
     expect(res.status).toBe(201); // WRONG: API returns 200
     expect(res.body.status).toBe('ok');
   });
   ```
2. Commit and push the broken test:
   ```bash
   git add server/tests/api.test.js
   git commit -m "test: deliberately break health test"
   git push origin main
   ```
3. Open the **Actions** tab on GitHub.
4. The workflow triggers, executes Steps 1–3, and **fails on Step 4 (Run automated tests)** with a red cross (**Failed ❌**).
5. Open the failed run log to inspect the failure:
   ```
   FAIL server/tests/api.test.js
     ● Task Manager API - In-Memory Integration Tests › GET /api/health returns 200 and status ok

       expect(received).toBe(expected)

       Expected: 201
       Received: 200

         18 |   it('GET /api/health returns 200 and status ok', async () => {
         19 |     const res = await request(app).get('/api/health');
       > 20 |     expect(res.status).toBe(201);
            |                        ^
   ```
6. **Key Observation**: The pipeline halted immediately at Step 4; Step 5 (`npm run build`) was never executed. Broken code is prevented from advancing.

### Step C: Fix and Recovery (The Green Run)
1. Restore `expect(res.status).toBe(200);` in `server/tests/api.test.js`.
2. Commit and push the fix:
   ```bash
   git add server/tests/api.test.js
   git commit -m "fix: correct health test"
   git push origin main
   ```
3. Check the **Actions** tab.
4. The pipeline passes completely with a green checkmark (**Passed ✔️**).
5. The `README.md` badge updates to `passing`.

---

## 9. Screenshots List / Verification Proofs

When preparing the lab submission, include the following 7 screenshots:
1. `p12-local-tests.png`: Terminal output of `npm test` running locally on Windows, showing `5 passed, 5 total`.
2. `p12-workflow-file.png`: GitHub view of `.github/workflows/ci.yml` in the repository tree.
3. `p12-actions-failed.png`: GitHub Actions tab showing the red ❌ run for the deliberate failure commit (`test: deliberately break health test`).
4. `p12-failed-log.png`: Expanded GitHub Actions runner step log showing `Expected: 201`, `Received: 200` with exit code 1.
5. `p12-actions-passed.png`: Expanded GitHub Actions runner log showing all 5 steps green with checkmarks.
6. `p12-actions-list.png`: Actions history view displaying both the failed run and the recovered green run.
7. `p12-readme-badge.png`: Top of repository `README.md` displaying the green `CI Pipeline: passing` status badge.

---

## 10. Key Questions and Answers

### Q1. Difference between Continuous Integration and Continuous Deployment, and which one this practical demonstrates?
**Answer**:
- **Continuous Integration (CI)** is the automated practice where developers regularly merge code changes into a central repository, triggering automated builds and test suites to detect integration errors as early as possible.
- **Continuous Deployment (CD)** takes CI one step further: after the build and test stages pass, the release artifact is automatically packaged and deployed directly to staging or production infrastructure (e.g., cloud VMs, Kubernetes, Vercel, AWS ECS) without human intervention.
- **This practical implements CI only**: It automates environment setup, dependency installation, automated integration testing, and build compilation. It does not automatically push containers to a registry or deploy the application to a cloud server.

### Q2. Why automatic tests on every push catch problems earlier than manual testing before a release?
**Answer**:
1. **Immediate Fault Localization**: Because CI runs on every single push, when a test breaks, the developer knows precisely which commit caused the regression within 1–2 minutes of writing it, while the context is still fresh.
2. **Eliminates Human Fatigue**: Manual testing is repetitive, error-prone, and developers often skip testing peripheral endpoints when making quick fixes. Automated CI executes the exact same suite consistently every time.
3. **Exponential Cost Reduction**: Fixing a bug caught during local CI costs minutes. Discovering the same bug in pre-release staging or production costs hours or days of emergency triaging, rollbacks, and hotfixes.

### Q3. If the test file path were wrong, would it fail at the same step as a real test failure?
**Answer**:
Yes and No:
- **Same Pipeline Step**: Both would fail at **Step 4: Run automated tests** (`npm test`), resulting in an exit code 1 that stops the pipeline.
- **Different Underlying Cause**:
  - If the test file path is wrong (e.g., misconfigured `testMatch` in `package.json`), Jest terminates with `No tests found` or `Pattern did not match any files`. The failure is an **infrastructure / configuration error**.
  - When code is broken, Jest discovers the test file, executes the assertions, and fails on `expect(received).toBe(expected)` with a detailed diff. The failure is a **code / logic regression**.
Reading the runner log is critical to distinguish whether code broke or the test runner configuration was corrupted.

### Q4. Why does `GET /tasks` return 401 in CI and how do the tests handle authentication?
**Answer**:
In Practical 7 and Practical 9, `authMiddleware` was applied to all `/tasks` routes (`router.use(authMiddleware)`). Any incoming request without a valid `Authorization: Bearer <token>` header is rejected with HTTP 401 Unauthorized.

Because our CI environment has no database and no registered users:
- The PDF's simplified requirement of "GET /tasks returns 200" is impossible without authentication in a secured production application.
- Our test suite handles this properly:
  1. It asserts that unauthenticated requests to `/tasks` correctly return `401 Unauthorized` (verifying security).
  2. For protected endpoint verification (`/tasks/cache/stats`), the test uses `jwt.sign({ id: '...' }, process.env.JWT_SECRET)` to create a mathematically valid token in RAM. `authMiddleware` verifies the cryptographic signature without needing to query a database, allowing the route to return `200 OK`.

### Q5. Why Node 20 is used instead of Node 18?
**Answer**:
1. **Mongoose 9 Requirement**: The application uses Mongoose 9 (`^9.9.3`). The official minimum required runtime for Mongoose 9 is **Node.js 20+**. Running on Node 18 leads to stream and Promise compatibility errors.
2. **Dotenv 17 Compatibility**: Dotenv 17 requires modern V8 engine features available in Node 20.
3. **Active LTS Stability**: Node 20 is the current Active Long-Term Support release on GitHub Actions (`ubuntu-latest`), guaranteeing security patches and optimal performance.

---

## 11. Troubleshooting Common CI/CD Issues

| Symptom / Error | Root Cause | Solution |
|---|---|---|
| **Workflow not shown under Actions tab** | File is in the wrong directory or has wrong extension (e.g., `.github/workflow/ci.yml` instead of `.github/workflows/ci.yml`). | Ensure exact path: `.github/workflows/ci.yml` (plural `workflows`). |
| **YAML syntax error (`mapping values are not allowed here` or `bad indentation`)** | Tab characters used for indentation, or misaligned spaces. | Use 2 spaces for indentation. Never use tabs in YAML. Validate syntax with `python -c "import yaml; yaml.safe_load(...)"`. |
| **`no test specified`** | `npm test` default script in `package.json` was not replaced with Jest command. | Update `package.json` scripts: `"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"`. |
| **"Cannot use import statement outside a module"** | Jest runs in CommonJS mode by default and does not parse ES Modules (`import`/`export`). | Run Jest with `--experimental-vm-modules` flag and specify `"transform": {}` in Jest config. |
| **Jest hangs after tests pass** | `node-cache` internal timer or active database socket keeps event loop alive. | Call `cache.close()` in `afterAll()`, and wrap `app.listen()` / `connectDB()` in `NODE_ENV !== 'test'`. |
| **Pipeline passes with a broken test** | Test uses dummy assertion like `expect(true).toBe(true)` or lacks `async/await`. | Use Supertest assertions with `await request(app)` checking status codes and response body properties. |

---

## 12. Conclusion
In Practical 12, a robust Continuous Integration pipeline was implemented using **GitHub Actions**. By making the Express server testable in-memory and configuring **Jest** with native ES Module support, five integration tests execute cleanly in under 2 seconds without requiring an external database. The automated workflow guarantees that every push to `main` is validated through dependency installation, test execution, and production compilation, preventing regressions and establishing a production-grade DevOps foundation.
