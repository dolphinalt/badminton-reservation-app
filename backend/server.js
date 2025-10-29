const { isTimeNotPassed } = require('./utils/utils.js');
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
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
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
        { userId: req.user.id, email: req.user.email, name: req.user.name },
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
         ORDER BY r.queue_position ASC
         LIMIT 1`,
        [court.id]
      );
      
      let status = 'open';
      let time = null;
      let session_info = null;
      
      if (activeSession) {
        status = 'in_use';
        const remaining = new Date(activeSession.expires_at) - new Date();
        const remainingMinutes = Math.max(0, Math.ceil(remaining / (1000 * 60)));
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
      const remainingSeconds = Math.max(0, Math.ceil(remaining / 1000));
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
    
    // Calculate session duration (1 minute)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 1 * 60 * 1000);
    
    // Remove user from queue if they have a reservation for this court
    const userReservation = await database.get(
      `SELECT * FROM reservations WHERE user_id = ? AND court_id = ? AND status = 'reserved'`,
      [userId, courtId]
    );
    
    if (userReservation) {
      console.log(`Removing user ${userId} from queue for court ${courtId} as they're taking the court`);
      
      // Delete the user's reservation
      await database.run(
        `DELETE FROM reservations WHERE id = ?`,
        [userReservation.id]
      );
      
      // Shift everyone else up in the queue
      await database.run(
        `UPDATE reservations 
         SET queue_position = queue_position - 1 
         WHERE court_id = ? AND status = 'reserved' AND queue_position > ?`,
        [courtId, userReservation.queue_position]
      );
      
      console.log(`Queue updated: removed user ${userId} and shifted positions`);
    }
    
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
app.get('/api/queue', authenticateToken, async (req, res) => {
  try {
    // Get all reservations ordered by court and queue position
    const reservations = await database.all(
      `SELECT r.*, c.name as court_name, u.name as user_name
       FROM reservations r
       JOIN courts c ON r.court_id = c.id
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'reserved'
       ORDER BY r.court_id, r.queue_position`
    );
    
    // Group by court
    const queueByCourtId = {};
    reservations.forEach(reservation => {
      if (!queueByCourtId[reservation.court_id]) {
        queueByCourtId[reservation.court_id] = [];
      }
      queueByCourtId[reservation.court_id].push(reservation);
    });
    
    res.json({ queueByCourtId });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gym status route - always open for queue system
app.get('/api/gym/open-status', async (req, res) => {
  try {
    res.json({ 
      isOpen: true,
      message: "Queue system is always available" 
    });
  } catch (error) {
    console.error('Error fetching gym open status:', error);
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
       WHERE r.status = 'reserved' AND r.user_id = ?
       ORDER BY r.court_id, r.queue_position`,
      [req.user.userId]
    );
    
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reservations for a specific court and time slot
app.get('/api/reservations/check', authenticateToken, async (req, res) => {
  try {
    const { courtId } = req.query;
    
    if (!courtId) {
      return res.status(400).json({ error: 'Court ID is required' });
    }
    
    const userReservation = await database.get(
      `SELECT r.*, u.name as user_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.court_id = ? AND r.user_id = ? AND r.status = 'reserved'`,
      [courtId, req.user.userId]
    );
    
    res.json({ 
      hasReservation: !!userReservation,
      reservation: userReservation || null
    });
  } catch (error) {
    console.error('Error checking reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all current reservations for the UI (to show which slots are taken)
app.get('/api/reservations/all', authenticateToken, async (req, res) => {
  try {
    const reservations = await database.all(
      `SELECT r.court_id, r.queue_position, r.user_id, r.user_name, u.name as user_name
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'reserved'
       ORDER BY r.court_id, r.queue_position`
    );
    
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const { courtId } = req.body;
    const userId = req.user.userId;
    let userName = req.user.name;
    
    // If name is not in JWT, get it from database
    if (!userName) {
      const user = await database.get(
        `SELECT name FROM users WHERE id = ?`,
        [userId]
      );
      userName = user?.name || 'Unknown User';
    }
    
    if (!courtId) {
      return res.status(400).json({ error: 'Court ID is required' });
    }
    
    // Check if user already has an active reservation
    const existingReservation = await database.get(
      `SELECT * FROM reservations WHERE user_id = ? AND status = 'reserved'`,
      [userId]
    );
    
    if (existingReservation) {
      return res.status(400).json({ error: 'You already have an active reservation. Cancel your current reservation to make a new one.' });
    }
    
    // Check if user is currently using any court
    const activeSession = await database.get(
      `SELECT * FROM court_sessions WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    
    if (activeSession) {
      return res.status(400).json({ error: 'Cannot make reservation while using a court' });
    }
    
    // Get the next queue position for this court
    const lastPosition = await database.get(
      `SELECT MAX(queue_position) as max_pos FROM reservations WHERE court_id = ? AND status = 'reserved'`,
      [courtId]
    );
    
    const nextPosition = (lastPosition?.max_pos || 0) + 1;
    
    // Create reservation
    const result = await database.run(
      `INSERT INTO reservations (court_id, user_id, user_name, queue_position) VALUES (?, ?, ?, ?)`,
      [courtId, userId, userName, nextPosition]
    );
    
    res.json({
      reservation: {
        id: result.id,
        court_id: parseInt(courtId),
        queue_position: nextPosition,
        user_id: userId,
        user_name: userName,
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

// Check if current user is using any court
app.get('/api/courts/user-usage-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userActiveSession = await database.get(
      `SELECT * FROM court_sessions WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')`,
      [userId]
    );
    
    const isCurrentUserUsingAnyCourt = !!userActiveSession;
    
    res.json({ 
      isCurrentUserUsingAnyCourt,
      activeSession: userActiveSession 
    });
  } catch (error) {
    console.error('Error checking user court usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Release court (end session early)
app.post('/api/courts/:id/release', authenticateToken, async (req, res) => {
  try {
    const courtId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Check if user has an active session on this court
    const activeSession = await database.get(
      `SELECT * FROM court_sessions 
       WHERE court_id = ? AND user_id = ? AND status = 'active' AND expires_at > datetime('now')`,
      [courtId, userId]
    );

    if (!activeSession) {
      return res.status(400).json({ error: 'No active session found for this court' });
    }

    // End the session
    await database.run(
      `UPDATE court_sessions 
       SET status = 'completed' 
       WHERE id = ?`,
      [activeSession.id]
    );

    console.log(`User ${userId} released court ${courtId}`);

    res.json({ 
      message: 'Court released successfully',
      court_id: courtId
    });
  } catch (error) {
    console.error('Error releasing court:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advance queue endpoint - releases current session and starts next person in queue
app.post('/api/courts/:id/advance-queue', authenticateToken, async (req, res) => {
  try {
    const courtId = parseInt(req.params.id);
    const userId = req.user.userId;

    console.log(`Manual queue advance triggered for court ${courtId} by user ${userId}`);

    // Check if user has an active session on this court
    const activeSession = await database.get(
      `SELECT * FROM court_sessions 
       WHERE court_id = ? AND user_id = ? AND status = 'active'`,
      [courtId, userId]
    );

    if (!activeSession) {
      return res.status(400).json({ error: 'No active session found for this court' });
    }

    // End the current session
    await database.run(
      `UPDATE court_sessions 
       SET status = 'completed' 
       WHERE id = ?`,
      [activeSession.id]
    );

    console.log(`Ended session ${activeSession.id} for court ${courtId}`);

    // Immediately advance the queue
    await autoStartNextInQueue(courtId);

    res.json({ 
      message: 'Court released and queue advanced successfully',
      court_id: courtId
    });
  } catch (error) {
    console.error('Error advancing queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public endpoint for unauthenticated users to view court status
app.get('/api/public/courts-status', async (req, res) => {
  try {
    const courts = await database.all('SELECT * FROM courts ORDER BY id');
    const courtsWithStatus = [];

    for (const court of courts) {
      // Check if court is currently being used
      const activeSession = await database.get(
        `SELECT * FROM court_sessions 
         WHERE court_id = ? AND status = 'active' AND expires_at > datetime('now')`,
        [court.id]
      );

      // Count reservations for this court
      const reservationCount = await database.get(
        `SELECT COUNT(*) as count FROM reservations 
         WHERE court_id = ? AND status = 'reserved'`,
        [court.id]
      );

      let status, color;
      if (activeSession) {
        // Calculate remaining time
        const expiresAt = new Date(activeSession.expires_at);
        const now = new Date();
        const remainingMs = expiresAt.getTime() - now.getTime();
        const remainingMinutes = Math.max(0, Math.ceil(remainingMs / (1000 * 60)));
        
        status = `In Use (${remainingMinutes}m left)`;
        color = 'text-red-500';
      } else {
        status = 'Available';
        color = 'text-green-500';
      }

      courtsWithStatus.push({
        id: court.id,
        name: court.name,
        status,
        color,
        reservationCount: reservationCount.count,
        isInUse: !!activeSession
      });
    }

    res.json({ courts: courtsWithStatus });
  } catch (error) {
    console.error('Error fetching public court status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint to manually trigger auto-advance (for debugging)
app.post('/api/test/trigger-auto-advance/:courtId', async (req, res) => {
  try {
    const courtId = parseInt(req.params.courtId);
    console.log(`Manually triggering auto-advance for court ${courtId}`);
    await autoStartNextInQueue(courtId);
    res.json({ message: `Auto-advance triggered for court ${courtId}` });
  } catch (error) {
    console.error('Error in test trigger:', error);
    res.status(500).json({ error: 'Failed to trigger auto-advance' });
  }
});

// Test endpoint to create expired session (for debugging)
app.post('/api/test/create-expired-session/:courtId', async (req, res) => {
  try {
    const courtId = parseInt(req.params.courtId);
    const userId = 1; // Test user ID
    
    // Create a session that expired 1 minute ago
    const expiredTime = new Date(Date.now() - 60000).toISOString();
    
    const result = await database.run(
      `INSERT INTO court_sessions (court_id, user_id, expires_at, status) VALUES (?, ?, ?, 'active')`,
      [courtId, userId, expiredTime]
    );
    
    console.log(`Created expired session ${result.id} for court ${courtId}`);
    res.json({ 
      message: `Created expired session for court ${courtId}`,
      sessionId: result.id,
      expiredAt: expiredTime
    });
  } catch (error) {
    console.error('Error creating expired session:', error);
    res.status(500).json({ error: 'Failed to create expired session' });
  }
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
  
  // Start the cleanup interval for expired sessions
  startSessionCleanup();
});

// Cleanup expired sessions periodically
function startSessionCleanup() {
  console.log('Starting session cleanup interval...');
  
  // Run cleanup every 5 seconds for more responsive expiration
  setInterval(async () => {
    try {
      // Check current time and active sessions for debugging
      const currentTime = new Date().toISOString();
      const activeSessions = await database.all(
        `SELECT id, court_id, user_id, expires_at FROM court_sessions 
         WHERE status = 'active'`
      );
      
      console.log(`[${currentTime}] Cleanup check: ${activeSessions.length} active sessions`);
      if (activeSessions.length > 0) {
        activeSessions.forEach(session => {
          const expiresAt = new Date(session.expires_at);
          const now = new Date();
          const timeLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
          console.log(`  Session ${session.id}: Court ${session.court_id}, User ${session.user_id}, expires in ${timeLeft}s`);
        });
      }
      
      // First, find expired sessions before marking them as completed
      const expiredSessions = await database.all(
        `SELECT * FROM court_sessions 
         WHERE status = 'active' AND expires_at <= datetime('now')`
      );
      
      if (expiredSessions.length > 0) {
        console.log(`Found ${expiredSessions.length} expired session(s) to process`);
      }
      
      // Mark expired sessions as completed
      const result = await database.run(
        `UPDATE court_sessions 
         SET status = 'completed' 
         WHERE status = 'active' AND expires_at <= datetime('now')`
      );
      
      if (result.changes > 0) {
        console.log(`Auto-completed ${result.changes} court session(s) - timer reached 0`);
        
        // For each expired session, check if there's a queue and auto-start the next person
        for (const expiredSession of expiredSessions) {
          console.log(`Processing expired session for court ${expiredSession.court_id}, user ${expiredSession.user_id}`);
          await autoStartNextInQueue(expiredSession.court_id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }, 5000); // Check every 5 seconds for more responsive expiration
}

// Auto-start the next person in queue when a court becomes available
async function autoStartNextInQueue(courtId) {
  try {
    console.log(`\n=== AUTO-ADVANCE QUEUE for Court ${courtId} ===`);
    
    // Get the first person in queue for this court
    const nextInQueue = await database.get(
      `SELECT * FROM reservations 
       WHERE court_id = ? AND status = 'reserved' 
       ORDER BY queue_position ASC 
       LIMIT 1`,
      [courtId]
    );
    
    console.log(`Next in queue:`, nextInQueue);
    
    if (nextInQueue) {
      console.log(`Auto-starting next person in queue for court ${courtId}: User ${nextInQueue.user_id} (${nextInQueue.user_name})`);
      
      // Remove this person from the queue
      const deleteResult = await database.run(
        `DELETE FROM reservations WHERE id = ?`,
        [nextInQueue.id]
      );
      console.log(`Deleted reservation ${nextInQueue.id}, rows affected: ${deleteResult.changes}`);
      
      // Shift everyone else up in the queue
      const updateResult = await database.run(
        `UPDATE reservations 
         SET queue_position = queue_position - 1 
         WHERE court_id = ? AND status = 'reserved' AND queue_position > ?`,
        [courtId, nextInQueue.queue_position]
      );
      console.log(`Updated queue positions, rows affected: ${updateResult.changes}`);
      
      // Calculate session duration (1 minute)
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1 * 60 * 1000);
      
      // Create new court session for the next person
      const sessionResult = await database.run(
        `INSERT INTO court_sessions (court_id, user_id, expires_at) VALUES (?, ?, ?)`,
        [courtId, nextInQueue.user_id, endTime.toISOString()]
      );
      
      console.log(`Successfully started court session for user ${nextInQueue.user_id} on court ${courtId}`);
      console.log(`Session ID: ${sessionResult.id}, expires at: ${endTime.toISOString()}`);
    } else {
      console.log(`No queue for court ${courtId} - court is now available`);
    }
    console.log(`=== END AUTO-ADVANCE ===\n`);
  } catch (error) {
    console.error(`Error auto-starting next person in queue for court ${courtId}:`, error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await database.close();
  process.exit(0);
});