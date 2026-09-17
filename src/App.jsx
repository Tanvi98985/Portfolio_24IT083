import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import './App.css';

// Helper function to add a minimum delay (~300ms) for lazy loading
// This prevents quick layout flicker on fast connections
const lazyWithDelay = (importFunc, delay = 300) => {
  return lazy(() =>
    Promise.all([
      importFunc(),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]).then(([moduleExports]) => moduleExports)
  );
};

// Lazy-loaded route components (code splitting per route)
const Projects = lazyWithDelay(() => import('./pages/Projects.jsx'));
const TaskManager = lazyWithDelay(() => import('./pages/TaskManager.jsx'));
const Contact = lazyWithDelay(() => import('./pages/Contact.jsx'));

// Theme-aligned fallback UI for route transitions
function PageLoader() {
  return (
    <div className="spinner-container" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--navy-dark)', fontWeight: '500' }}>Loading page...</p>
    </div>
  );
}

function App() {
  return (
    <>
      <NavBar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}

export default App;
