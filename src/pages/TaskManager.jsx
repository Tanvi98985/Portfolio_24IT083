import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  loginUser,
  registerUser,
  fetchMe,
  logoutUser,
  getAuthToken,
  setOnUnauthorized,
} from '../api';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

function TaskManager() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Task State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item Action States
  const [updatingId, setUpdatingId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch tasks for authenticated user
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const data = await fetchMe();
        if (data && data.user) {
          setUser(data.user);
          await loadTasks();
        }
      } catch {
        logoutUser();
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    };

    setOnUnauthorized(() => {
      logoutUser();
      setUser(null);
      setTasks([]);
      showToast('Session expired or unauthorized. Please log in.', 'error');
    });

    checkSession();
  }, [loadTasks, showToast]);

  // Handle Authentication Submit (Login / Register)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    if (authTab === 'register' && authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authTab === 'register') {
        await registerUser({
          email: authEmail.trim(),
          password: authPassword,
        });
        showToast('Registration successful! Please log in.', 'success');
        setAuthTab('login');
        setAuthPassword('');
      } else {
        const data = await loginUser({
          email: authEmail.trim(),
          password: authPassword,
        });
        setUser(data.user);
        setAuthEmail('');
        setAuthPassword('');
        showToast(`Welcome back, ${data.user.email}!`, 'success');
        await loadTasks();
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      showToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTasks([]);
    showToast('Logged out successfully.', 'success');
  };

  // Handle Task Creation with Optimistic UI Update
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const taskTitle = title.trim();
    const taskDesc = description.trim();
    const tempId = `temp_${Date.now()}`;

    // Optimistic task item
    const optimisticTask = {
      _id: tempId,
      title: taskTitle,
      description: taskDesc,
      completed: false,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setTitle('');
    setDescription('');

    try {
      const createdTask = await createTask({
        title: taskTitle,
        description: taskDesc,
      });

      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? createdTask : t))
      );
      showToast('Task created successfully!', 'success');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      setTitle(taskTitle);
      setDescription(taskDesc);
      showToast(`Failed to create task: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Task Status Toggle (PUT /tasks/:id)
  const handleToggleComplete = async (task) => {
    if (task.optimistic || updatingId) return;

    setUpdatingId(task._id);
    const newStatus = !task.completed;

    try {
      const updated = await updateTask(task._id, { completed: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? updated : t))
      );
      showToast(
        newStatus ? 'Task marked as completed!' : 'Task marked as pending.',
        'success'
      );
    } catch (err) {
      showToast(`Failed to update task: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Task Deletion (DELETE /tasks/:id)
  const handleConfirmDelete = async () => {
    if (!taskToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      showToast('Task deleted successfully!', 'success');
      setTaskToDelete(null);
    } catch (err) {
      showToast(`Failed to delete task: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authChecking) {
    return <Spinner />;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Task Manager</h1>
          <p className="page-subtitle">
            Full-stack CRUD with JWT Authentication, Protected Routes, & MongoDB Atlas.
          </p>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>
              Logged in as: <strong>{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={loadTasks}
              disabled={loading}
              className="toggle-btn"
              style={{ marginBottom: 0, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              ↻ Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="linkedin-link"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer', background: 'transparent' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Unauthenticated View: Login / Register Form */}
      {!user ? (
        <section
          className="project-card"
          style={{
            maxWidth: '520px',
            margin: '2rem auto',
            backgroundColor: 'var(--white)',
            borderTop: '4px solid var(--navy)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--light-gray)', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className="toggle-btn"
              style={{
                marginBottom: 0,
                backgroundColor: authTab === 'login' ? 'var(--navy-dark)' : 'var(--light-gray)',
                color: authTab === 'login' ? 'var(--white)' : 'var(--navy-dark)',
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
              className="toggle-btn"
              style={{
                marginBottom: 0,
                backgroundColor: authTab === 'register' ? 'var(--navy-dark)' : 'var(--light-gray)',
                color: authTab === 'register' ? 'var(--white)' : 'var(--navy-dark)',
              }}
            >
              Register
            </button>
          </div>

          <h3 style={{ marginBottom: '0.5rem', color: 'var(--navy-dark)' }}>
            {authTab === 'login' ? 'Sign In to Your Account' : 'Create New Account'}
          </h3>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
            {authTab === 'login'
              ? 'Enter your credentials to access your protected tasks.'
              : 'Register with your email and a password (min. 6 characters).'}
          </p>

          {authError && (
            <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              {authError}
            </p>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="auth-email"
                style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--navy-dark)', fontWeight: 'bold', fontSize: '0.95rem' }}
              >
                Email Address *
              </label>
              <input
                id="auth-email"
                type="email"
                className="search-box"
                placeholder="name@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', marginBottom: 0 }}
                disabled={authLoading}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="auth-password"
                style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--navy-dark)', fontWeight: 'bold', fontSize: '0.95rem' }}
              >
                Password *
              </label>
              <input
                id="auth-password"
                type="password"
                className="search-box"
                placeholder={authTab === 'register' ? 'At least 6 characters' : 'Enter your password'}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                style={{ width: '100%', maxWidth: '100%', marginBottom: 0 }}
                disabled={authLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="submit-btn"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: 0 }}
            >
              {authLoading
                ? (authTab === 'login' ? 'Signing In...' : 'Registering...')
                : (authTab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </section>
      ) : (
        /* Authenticated View: Task Creation & List */
        <>
          {/* Task Creation Form */}
          <section
            className="project-card"
            style={{
              marginBottom: '2.5rem',
              backgroundColor: 'var(--white)',
              borderTop: '4px solid var(--navy)',
            }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--navy-dark)' }}>
              Create New Task
            </h3>

            {formError && (
              <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: '0.8rem', fontWeight: 'bold' }}>
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="task-title"
                  style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--navy-dark)', fontWeight: 'bold', fontSize: '0.95rem' }}
                >
                  Task Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  className="search-box"
                  placeholder="e.g., Implement JWT Auth Middleware"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', marginBottom: 0 }}
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label
                  htmlFor="task-description"
                  style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--navy-dark)', fontWeight: 'bold', fontSize: '0.95rem' }}
                >
                  Description (Optional)
                </label>
                <textarea
                  id="task-description"
                  className="search-box"
                  placeholder="Add details or acceptance criteria..."
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', maxWidth: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit' }}
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn"
                style={{ marginTop: 0 }}
              >
                {isSubmitting ? 'Adding Task...' : '+ Add Task'}
              </button>
            </form>
          </section>

          {/* Task List Section */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--navy-dark)', fontSize: '1.5rem', margin: 0 }}>
                Task List ({tasks.length})
              </h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                {tasks.filter((t) => t.completed).length} of {tasks.length} completed
              </span>
            </div>

            {loading ? (
              <Spinner />
            ) : error ? (
              <ErrorMessage message={error} onRetry={loadTasks} />
            ) : tasks.length === 0 ? (
              <div
                className="project-card"
                style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-gray)' }}
              >
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No tasks found.</p>
                <p style={{ fontSize: '0.9rem' }}>Use the form above to add your first task to MongoDB.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map((task) => {
                  const isUpdating = updatingId === task._id;

                  return (
                    <div
                      key={task._id}
                      className="project-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        borderLeft: task.completed ? '5px solid #2e7d32' : '5px solid var(--navy)',
                        borderTop: 'none',
                        opacity: task.optimistic ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                          <input
                            type="checkbox"
                            id={`check-${task._id}`}
                            checked={task.completed}
                            onChange={() => handleToggleComplete(task)}
                            disabled={isUpdating || task.optimistic}
                            style={{
                              marginTop: '0.3rem',
                              width: '18px',
                              height: '18px',
                              cursor: isUpdating || task.optimistic ? 'not-allowed' : 'pointer',
                            }}
                          />
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '1.15rem',
                                color: task.completed ? 'var(--text-gray)' : 'var(--navy-dark)',
                                textDecoration: task.completed ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p
                                style={{
                                  marginTop: '0.4rem',
                                  marginBottom: 0,
                                  color: 'var(--text-gray)',
                                  fontSize: '0.95rem',
                                }}
                              >
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            className="skill-badge"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.6rem',
                              backgroundColor: task.completed ? '#2e7d32' : 'var(--navy)',
                            }}
                          >
                            {task.completed ? 'Completed' : 'Pending'}
                          </span>

                          {task.optimistic ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontStyle: 'italic' }}>
                              Saving...
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              aria-label={`Delete task ${task.title}`}
                              style={{
                                background: 'none',
                                border: '1px solid #d32f2f',
                                color: '#d32f2f',
                                borderRadius: '4px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#d32f2f';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#d32f2f';
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {task.createdAt && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Confirmation Dialog Before Delete */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This cannot be undone.` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default TaskManager;
