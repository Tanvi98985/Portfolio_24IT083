# Student Portfolio

A React + Vite portfolio app built for Practical 1 (component architecture)
and Practical 2 (routing + state management).

## Features

- **Components:** Header, About, Skills, Footer, NavBar (Practical 1)
- **Routing:** React Router with Home, Projects, and Contact pages, plus a
  custom 404 page for unknown routes (Practical 2)
- **State:** `useState` used to toggle project details visibility, and to
  control the Contact page's message textarea with a live character count

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`) in your
browser.

## Project Structure

```
src/
├── main.jsx          # Wraps App in BrowserRouter
├── App.jsx           # Defines routes, NavBar, Footer
├── App.css           # Theme styling
├── components/
│   ├── Header.jsx
│   ├── About.jsx
│   ├── Skills.jsx
│   ├── Footer.jsx
│   └── NavBar.jsx
└── pages/
    ├── Home.jsx
    ├── Projects.jsx
    ├── Contact.jsx
    └── NotFound.jsx
```
