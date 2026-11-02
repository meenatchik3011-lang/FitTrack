
import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate
} from 'react-router-dom';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

import api from './api';

// ==================================================
// COMMON HELPER
// ==================================================

function refreshNotificationCount() {
  window.dispatchEvent(
    new Event('fittrack-notifications-updated')
  );
}

// ==================================================
// PROTECTED ROUTE
// ==================================================

function Protected({ children }) {
  return localStorage.getItem('fittrack_token')
    ? children
    : <Navigate to="/login" replace />;
}

// ==================================================
// MODULE 1 - LOGIN AND REGISTER
// ==================================================

function Auth({ register = false }) {

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const nav = useNavigate();

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  async function submit(e) {
    e.preventDefault();
    setError('');

    try {
      if (register) {
        await api.post('/auth/register', form);

        alert('Registration successful. Please log in.');
        nav('/login');

      } else {

        const response = await api.post('/auth/login', {
          email: form.email,
          password: form.password
        });

        localStorage.setItem(
          'fittrack_token',
          response.data.access_token
        );

        localStorage.setItem(
          'fittrack_user',
          JSON.stringify(response.data.user)
        );

        nav('/');
      }

    } catch (err) {
      setError(
        err.response?.data?.detail || 'Request failed'
      );
    }
  }

  return (
    <main className="auth">
      <form className="panel" onSubmit={submit}>

        <h1>FitTrack</h1>

        <p>Your fitness, your progress.</p>

        {register && (
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={change}
            required
            minLength="3"
          />
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={change}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={change}
          required
          minLength="8"
        />

        {error && (
          <p className="error">{error}</p>
        )}

        <button type="submit">
          {register ? 'Create account' : 'Login'}
        </button>

        <p>
          {register
            ? 'Already registered? '
            : 'New to FitTrack? '
          }

          <Link to={register ? '/login' : '/register'}>
            {register ? 'Login' : 'Register'}
          </Link>
        </p>

      </form>
    </main>
  );
}

// ==================================================
// COMMON LAYOUT WITH NOTIFICATION COUNT
// ==================================================

function Layout({ children }) {

  const nav = useNavigate();

  const user = JSON.parse(
    localStorage.getItem('fittrack_user') || '{}'
  );

  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread notification count
  async function loadUnreadCount() {
    try {

      const response = await api.get(
        '/notifications/unread-count'
      );

      setUnreadCount(
        response.data.unread_count
      );

    } catch (error) {

      console.error(
        'Failed to load notification count:',
        error.response?.data || error.message
      );

    }
  }

  useEffect(() => {

    // Initial count
    loadUnreadCount();

    // Listen for notification updates
    const handleUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener(
      'fittrack-notifications-updated',
      handleUpdate
    );

    // Refresh count every 15 seconds
    const interval = setInterval(
      loadUnreadCount,
      15000
    );

    return () => {

      window.removeEventListener(
        'fittrack-notifications-updated',
        handleUpdate
      );

      clearInterval(interval);
    };

  }, []);

  function logout() {
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('fittrack_user');
    nav('/login');
  }

  return (
    <>

      <header>

        <b>FitTrack</b>

        <nav>

          <Link to="/">Dashboard</Link>

          <Link to="/workouts">Workouts</Link>

          <Link to="/goals">Goals</Link>

          <Link to="/reports">Reports</Link>

          <Link
            to="/notifications"
            className="notification-link"
          >
            Notifications

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99
                  ? '99+'
                  : unreadCount
                }
              </span>
            )}

          </Link>

        </nav>

        <span>
          {user.username || 'User'}

          <button
            className="small"
            onClick={logout}
          >
            Logout
          </button>
        </span>

      </header>

      <main className="container">
        {children}
      </main>

    </>
  );
}

// ==================================================
// MODULE 3 - DASHBOARD
// ==================================================

function Dashboard() {

  const [stats, setStats] = useState({});
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {

    Promise.all([
      api.get('/progress/daily'),
      api.get('/workouts')
    ])
      .then(([a, b]) => {

        setStats(a.data);
        setWorkouts(b.data.slice(0, 5));

      })
      .catch(error => {
        console.error(error);
      });

  }, []);

  return (
    <Layout>

      <h1>Dashboard</h1>

      <section className="cards">

        <article>
          <small>Today's workouts</small>
          <h2>{stats.total_workouts ?? 0}</h2>
        </article>

        <article>
          <small>Calories burned today</small>
          <h2>{stats.total_calories ?? 0}</h2>
        </article>

        <article>
          <small>Minutes today</small>
          <h2>{stats.total_duration ?? 0}</h2>
        </article>

      </section>

      <h2>Recent workouts</h2>

      <WorkoutTable items={workouts} />

    </Layout>
  );
}

// ==================================================
// WORKOUT TABLE
// ==================================================

function WorkoutTable({
  items,
  onEdit,
  onDelete
}) {

  return (

    <div className="tablewrap">

      <table>

        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Calories</th>
            <th>Date</th>

            {onEdit && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>

          {items.map(w => (

            <tr key={w.id}>

              <td>{w.workout_name}</td>
              <td>{w.category}</td>
              <td>{w.duration} min</td>
              <td>{w.calories_burned}</td>
              <td>{w.workout_date}</td>

              {onEdit && (
                <td>

                  <button
                    className="small"
                    onClick={() => onEdit(w)}
                  >
                    Edit
                  </button>

                  <button
                    className="small danger"
                    onClick={() => onDelete(w.id)}
                  >
                    Delete
                  </button>

                </td>
              )}

            </tr>

          ))}

          {!items.length && (
            <tr>
              <td colSpan="6">
                No workouts logged yet.
              </td>
            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}

// ==================================================
// MODULE 2 - WORKOUT MANAGEMENT
// ==================================================

const emptyWorkout = {
  workout_name: '',
  category: 'Cardio',
  duration: 30,
  calories_burned: 100,
  workout_date: new Date().toISOString().slice(0, 10)
};

function Workouts() {

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyWorkout);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const response = await api.get('/workouts');
    setItems(response.data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function submit(e) {

    e.preventDefault();
    setError('');

    try {

      if (editing) {

        await api.put(
          `/workouts/${editing}`,
          form
        );

      } else {

        await api.post('/workouts', form);

      }

      setForm(emptyWorkout);
      setEditing(null);

      await load();

    } catch (error) {

      setError(
        error.response?.data?.detail ||
        'Could not save workout'
      );

    }
  }

  async function del(id) {

    if (window.confirm('Delete this workout?')) {

      try {

        await api.delete(`/workouts/${id}`);
        await load();

      } catch (error) {

        alert('Could not delete workout');

      }
    }
  }

  function edit(w) {

    setEditing(w.id);

    setForm({
      workout_name: w.workout_name,
      category: w.category,
      duration: w.duration,
      calories_burned: w.calories_burned,
      workout_date: w.workout_date
    });
  }

  return (
    <Layout>

      <h1>Workout Management</h1>

      <form
        className="panel formgrid"
        onSubmit={submit}
      >

        <h2>
          {editing ? 'Edit workout' : 'Add workout'}
        </h2>

        <input
          placeholder="Workout name"
          value={form.workout_name}
          onChange={e =>
            setForm({
              ...form,
              workout_name: e.target.value
            })
          }
          required
        />

        <select
          value={form.category}
          onChange={e =>
            setForm({
              ...form,
              category: e.target.value
            })
          }
        >
          <option>Cardio</option>
          <option>Strength</option>
          <option>Yoga</option>
        </select>

        <input
          type="number"
          min="1"
          placeholder="Duration"
          value={form.duration}
          onChange={e =>
            setForm({
              ...form,
              duration: +e.target.value
            })
          }
          required
        />

        <input
          type="number"
          min="0"
          placeholder="Calories burned"
          value={form.calories_burned}
          onChange={e =>
            setForm({
              ...form,
              calories_burned: +e.target.value
            })
          }
          required
        />

        <input
          type="date"
          value={form.workout_date}
          onChange={e =>
            setForm({
              ...form,
              workout_date: e.target.value
            })
          }
          required
        />

        <button type="submit">
          {editing ? 'Update' : 'Add workout'}
        </button>

        {editing && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditing(null);
              setForm(emptyWorkout);
            }}
          >
            Cancel
          </button>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

      </form>

      <h2>Your workouts</h2>

      <WorkoutTable
        items={items}
        onEdit={edit}
        onDelete={del}
      />

    </Layout>
  );
}

// ==================================================
// MODULE 4 - GOAL SETTING
// ==================================================

function Goals() {

  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    goal_type: 'Weight Loss',
    target_value: 5,
    current_value: 0,
    deadline: new Date(
      Date.now() + 30 * 86400000
    ).toISOString().slice(0, 10)
  });

  async function load() {
    const response = await api.get('/goals');
    setItems(response.data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function submit(e) {

    e.preventDefault();

    try {

      await api.post('/goals', form);

      await load();

      refreshNotificationCount();

    } catch (error) {

      alert(
        error.response?.data?.detail ||
        'Could not create goal'
      );

    }
  }

  async function update(g) {

    const value = window.prompt(
      'Enter updated progress value',
      g.current_value
    );

    if (value !== null && value.trim() !== '' && !isNaN(+value)) {

      try {

        await api.patch(
          `/goals/${g.id}`,
          { current_value: +value }
        );

        await load();

        refreshNotificationCount();

      } catch (error) {

        alert('Could not update goal');

      }
    }
  }

  async function del(id) {

    if (window.confirm('Delete goal?')) {

      try {

        await api.delete(`/goals/${id}`);
        await load();

      } catch (error) {

        alert('Could not delete goal');

      }
    }
  }

  return (
    <Layout>

      <h1>Fitness Goals</h1>

      <form
        className="panel formgrid"
        onSubmit={submit}
      >

        <h2>Create goal</h2>

        <select
          value={form.goal_type}
          onChange={e =>
            setForm({
              ...form,
              goal_type: e.target.value
            })
          }
        >
          <option>Weight Loss</option>
          <option>Muscle Gain</option>
          <option>Steps</option>
        </select>

        <input
          type="number"
          min="0.1"
          step="any"
          placeholder="Target value"
          value={form.target_value}
          onChange={e =>
            setForm({
              ...form,
              target_value: +e.target.value
            })
          }
          required
        />

        <input
          type="number"
          min="0"
          step="any"
          placeholder="Current value"
          value={form.current_value}
          onChange={e =>
            setForm({
              ...form,
              current_value: +e.target.value
            })
          }
          required
        />

        <input
          type="date"
          value={form.deadline}
          onChange={e =>
            setForm({
              ...form,
              deadline: e.target.value
            })
          }
          required
        />

        <button type="submit">
          Create goal
        </button>

      </form>

      <div className="cards">

        {items.map(g => (

          <article key={g.id}>

            <h3>{g.goal_type}</h3>

            <p>
              {g.current_value} / {g.target_value}
            </p>

            <progress
              value={
                Math.min(
                  100,
                  g.current_value / g.target_value * 100
                )
              }
              max="100"
            />

            <p>
              Deadline: {g.deadline} · {g.status}
            </p>

            <button
              className="small"
              onClick={() => update(g)}
            >
              Update progress
            </button>

            <button
              className="small danger"
              onClick={() => del(g.id)}
            >
              Delete
            </button>

          </article>

        ))}

      </div>

      {!items.length && (
        <p>No goals yet.</p>
      )}

    </Layout>
  );
}

// ==================================================
// MODULE 5 - REPORTS AND ANALYTICS
// ==================================================

function Reports() {

  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState({});

  useEffect(() => {

    Promise.all([
      api.get('/reports/weekly'),
      api.get('/reports/monthly')
    ])
      .then(([w, m]) => {

        setWeekly(w.data);
        setMonthly(m.data);

      })
      .catch(console.error);

  }, []);

  return (
    <Layout>

      <h1>Reports & Analytics</h1>

      <section className="cards">

        <article>
          <small>Monthly workouts</small>
          <h2>{monthly.total_workouts ?? 0}</h2>
        </article>

        <article>
          <small>Monthly calories</small>
          <h2>{monthly.total_calories ?? 0}</h2>
        </article>

        <article>
          <small>Monthly minutes</small>
          <h2>{monthly.total_duration ?? 0}</h2>
        </article>

      </section>

      <article className="panel">

        <h2>Last 7 days — calories burned</h2>

        <div style={{ width: '100%', height: 300 }}>

          <ResponsiveContainer>

            <BarChart data={weekly}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="calories"
                name="Calories"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </article>

      <h2>Weekly detail</h2>

      <div className="tablewrap">

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Workouts</th>
              <th>Calories</th>
            </tr>
          </thead>

          <tbody>

            {weekly.map(d => (

              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.workouts}</td>
                <td>{d.calories}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </Layout>
  );
}

// ==================================================
// MODULE 6 - NOTIFICATIONS
// ==================================================

function Notifications() {

  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {

    try {

      const response = await api.get('/notifications');

      setItems(response.data);
      setError('');

      // Refresh navigation badge
      refreshNotificationCount();

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        'Failed to load notifications'
      );

    }
  }

  useEffect(() => {
    load();
  }, []);

  // Mark one notification as read
  async function read(id) {
    try {
      await api.patch(`/notifications/${id}/read`);

      // Update the page immediately, then reload from the server.
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );

      await load();
    } catch (err) {
      console.error('Mark notification as read failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      alert(
        err.response?.data?.detail ||
        `Could not mark notification as read (${err.response?.status || err.message})`
      );
    }
  }

  // Mark all notifications as read
  async function all() {
    try {
      await api.patch('/notifications/read-all');
      setItems(currentItems =>
        currentItems.map(item => ({ ...item, is_read: true }))
      );
      await load();
    } catch (err) {
      console.error('Mark all notifications as read failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      alert(
        err.response?.data?.detail ||
        `Could not mark all notifications as read (${err.response?.status || err.message})`
      );
    }
  }

  const unreadItems = items.filter(
    item => !item.is_read
  );

  return (
    <Layout>

      <div className="heading">

        <div>
          <h1>Notifications</h1>

          <p>
            {unreadItems.length} unread notifications
          </p>
        </div>

        <button
          onClick={all}
          disabled={unreadItems.length === 0}
        >
          Mark all read
        </button>

      </div>

      {error && (
        <p className="error">{error}</p>
      )}

      {items.map(n => (

        <article
          className={`panel notification ${
            n.is_read ? 'read-notification' : 'unread-notification'
          }`}
          key={n.id}
        >

          <div>

            <b>{n.title}</b>

            <p>{n.message}</p>

            <small>
              {new Date(
                n.created_at.endsWith('Z')
                  ? n.created_at
                  : n.created_at + 'Z'
              ).toLocaleString()}
            </small>

            {n.is_read && (
              <small className="read-label">
                Read
              </small>
            )}

          </div>

          {!n.is_read && (

            <button
              className="small"
              onClick={() => read(n.id)}
            >
              Mark read
            </button>

          )}

        </article>

      ))}

      {!items.length && !error && (
        <p>No notifications.</p>
      )}

    </Layout>
  );
}

// ==================================================
// MAIN APPLICATION
// ==================================================

export default function App() {

  return (

    <Routes>

      <Route
        path="/login"
        element={<Auth />}
      />

      <Route
        path="/register"
        element={<Auth register />}
      />

      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />

      <Route
        path="/workouts"
        element={
          <Protected>
            <Workouts />
          </Protected>
        }
      />

      <Route
        path="/goals"
        element={
          <Protected>
            <Goals />
          </Protected>
        }
      />

      <Route
        path="/reports"
        element={
          <Protected>
            <Reports />
          </Protected>
        }
      />

      <Route
        path="/notifications"
        element={
          <Protected>
            <Notifications />
          </Protected>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
