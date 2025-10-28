const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Database = require('./database');
const setupAuth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const database = new Database();

// Setup authentication
setupAuth(database);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}?error=auth_failed` }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
    } catch (error) {
      console.error('Error generating token:', error);
      res.redirect(`${process.env.FRONTEND_URL}?error=token_generation_failed`);
    }
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect(process.env.FRONTEND_URL);
  });
});

// User routes
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await database.get(
      `SELECT id, name, email, avatar FROM users WHERE id = ?`,
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Courts routes
app.get('/api/courts', authenticateToken, async (req, res) => {
  try {
    const courts = await database.all(`SELECT * FROM courts WHERE is_active = 1`);
    
    // Get current status for each court
    const courtsWithStatus = await Promise.all(courts.map(async (court) => {
      // Check for active session
      const activeSession = await database.get(
        `SELECT * FROM court_sessions 
         WHERE court_id = ? AND status = 'active' AND expires_at > datetime('now')`,
        [court.id]
      );
      
      // Check for upcoming reservation
      const nextReservation = await database.get(
        `SELECT r.*, u.name as user_name FROM reservations r
         JOIN users u ON r.user_id = u.id
         WHERE r.court_id = ? AND r.status = 'reserved'
         ORDER BY r.time_slot ASC
         LIMIT 1`,
        [court.id]
      );
      
      let status = 'open';
      let time = null;
      let session_info = null;
      
      if (activeSession) {
        status = 'in_use';
        const remaining = new Date(activeSession.expires_at) - new Date();
        const remainingMinutes = Math.ceil(remaining / (1000 * 60));
        time = `${remainingMinutes}m`;
        session_info = activeSession;
      }
      
      return {
        ...court,
        status,
        time,
        session_info,
        next_reservation: nextReservation
      };
    }));
    
    res.json({ courts: courtsWithStatus });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courts/:id/status', authenticateToken, async (req, res) => {
  try {
    const courtId = req.params.id;
    const court = await database.get(`SELECT * FROM courts WHERE id = ?`, [courtId]);
    
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    
    // Check for active session
    const activeSession = await database.get(
      `SELECT * FROM court_sessions 
       WHERE court_id = ? AND status = 'active' AND expires_at > datetime('now')`,
      [courtId]
    );
    
    let status = 'open';
    let time = null;
    let color = 'text-green-500';
    
    if (activeSession) {
      status = 'In Use';
      const remaining = new Date(activeSession.expires_at) - new Date();
      const remainingSeconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      time = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      color = 'text-red-500';
    } else {
      status = 'Open';
    }
    
    res.json({ status, time, color });
  } catch (error) {
    console.error('Error fetching court status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Take court endpoint
app.post('/api/courts/:id/take', authenticateToken, async (req, res) => {
  try {
    const courtId = req.params.id;
    const userId = req.user.userId;
    
    // Check if user already has an active reservation
    const existingReservation = await database.get(
      `SELECT * FROM reservations WHERE user_id = ? AND status = 'reserved'`,
      [userId]
    );
    
    if (existingReservation) {
      return res.status(400).json({ error: 'You already have an active reservation' });
    }
    
    // Check if any court is currently being used by this user
    const existingSession = await database.get(
      `SELECT * FROM court_sessions WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    
    if (existingSession) {
      return res.status(400).json({ error: 'You are already using a court' });
    }
    
    // Check if this court is available
    const activeSession = await database.get(
      `SELECT * FROM court_sessions 
       WHERE court_id = ? AND status = 'active' AND expires_at > datetime('now')`,
      [courtId]
    );
    
    if (activeSession) {
      return res.status(400).json({ error: 'Court is currently in use' });
    }
    
    // Calculate session duration (30 minutes)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    
    // Create court session
    const result = await database.run(
      `INSERT INTO court_sessions (court_id, user_id, expires_at) VALUES (?, ?, ?)`,
      [courtId, userId, endTime.toISOString()]
    );
    
    res.json({
      session: {
        id: result.id,
        court_id: parseInt(courtId),
        user_id: userId,
        started_at: startTime.toISOString(),
        expires_at: endTime.toISOString(),
        remaining_seconds: 1800
      }
    });
  } catch (error) {
    console.error('Error taking court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time slots routes
app.get('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    const timeSlots = await database.all(`SELECT * FROM time_slots ORDER BY time`);
    res.json({ timeSlots });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reservations routes
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const reservations = await database.all(
      `SELECT r.*, c.name as court_name, u.name as user_name 
       FROM reservations r
       JOIN courts c ON r.court_id = c.id
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'reserved'
       ORDER BY r.court_id, r.time_slot`
    );
    
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const { courtId, timeSlot } = req.body;
    const userId = req.user.userId;
    
    if (!courtId || !timeSlot) {
      return res.status(400).json({ error: 'Court ID and time slot are required' });
    }
    
    // Check if user already has a reservation
    const existingReservation = await database.get(
      `SELECT * FROM reservations WHERE user_id = ? AND status = 'reserved'`,
      [userId]
    );
    
    if (existingReservation) {
      return res.status(400).json({ error: 'You already have an active reservation' });
    }
    
    // Check if user is currently using any court
    const activeSession = await database.get(
      `SELECT * FROM court_sessions WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    
    if (activeSession) {
      return res.status(400).json({ error: 'Cannot make reservation while using a court' });
    }
    
    // Check if time slot is already reserved for this court
    const existingSlotReservation = await database.get(
      `SELECT * FROM reservations WHERE court_id = ? AND time_slot = ? AND status = 'reserved'`,
      [courtId, timeSlot]
    );
    
    if (existingSlotReservation) {
      return res.status(400).json({ error: 'This time slot is already reserved' });
    }
    
    // Create reservation
    const result = await database.run(
      `INSERT INTO reservations (court_id, time_slot, user_id) VALUES (?, ?, ?)`,
      [courtId, timeSlot, userId]
    );
    
    res.json({
      reservation: {
        id: result.id,
        court_id: parseInt(courtId),
        time_slot: timeSlot,
        user_id: userId,
        status: 'reserved'
      }
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const userId = req.user.userId;
    
    // Check if reservation exists and belongs to user
    const reservation = await database.get(
      `SELECT * FROM reservations WHERE id = ? AND user_id = ?`,
      [reservationId, userId]
    );
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Delete reservation
    await database.run(
      `DELETE FROM reservations WHERE id = ?`,
      [reservationId]
    );
    
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if any court is being used (for frontend logic)
app.get('/api/courts/usage-status', authenticateToken, async (req, res) => {
  try {
    const activeSessions = await database.all(
      `SELECT * FROM court_sessions WHERE status = 'active' AND expires_at > datetime('now')`
    );
    
    const hasActiveUsage = activeSessions.length > 0;
    
    res.json({ hasActiveCourtUsage: hasActiveUsage });
  } catch (error) {
    console.error('Error checking court usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await database.close();
  process.exit(0);
});