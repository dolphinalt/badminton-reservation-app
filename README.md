# Badminton Court Reservation System

This is a full-stack application with Google OAuth authentication for managing badminton court reservations.

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google People API)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. For "Application type", select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (for development)
   - Add your production URL when deploying

### 2. Backend Configuration

1. Navigate to the `backend` directory
2. Copy the example environment file and add your credentials:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Edit the `.env` file with your Google OAuth credentials:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_from_step_1
   GOOGLE_CLIENT_SECRET=your_google_client_secret_from_step_1
   JWT_SECRET=create_a_long_random_string_here
   SESSION_SECRET=create_another_long_random_string_here
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

### 3. Running the Application

1. **Start the Backend:**

   ```bash
   cd backend
   node server.js
   ```

   The backend will run on http://localhost:3001

2. **Start the Frontend:**
   ```bash
   cd badminton-reserve-app
   npm run dev
   ```
   The frontend will run on http://localhost:5173

### 4. Testing the Application

1. Open http://localhost:5173 in your browser
2. You should see an unauthenticated view with a "Sign in with Google" button
3. Click the button to test Google OAuth login
4. After successful login, you should be able to:
   - View and switch between courts
   - Make reservations for future time slots
   - Take courts for immediate use (30-minute sessions)
   - See real-time updates of court status

## Features

- **Google OAuth Authentication:** Secure login with Google accounts
- **Court Management:** 3 courts with real-time status updates
- **Reservations:** Book future time slots (2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM)
- **Immediate Use:** Take courts for immediate 30-minute sessions
- **User Management:** User-specific reservations and sessions
- **Real-time Updates:** Court status updates every 5 seconds
- **Conflict Prevention:** Prevents double-booking and conflicting reservations

## API Endpoints

- `GET /api/courts` - Get all courts with status
- `GET /api/courts/:id/status` - Get specific court status
- `POST /api/courts/:id/take` - Take a court immediately
- `GET /api/reservations` - Get user's reservations
- `POST /api/reservations` - Make a new reservation
- `DELETE /api/reservations/:id` - Cancel a reservation
- `GET /api/time-slots` - Get available time slots
- `GET /api/user` - Get current user info

## Database Schema

The application uses SQLite with the following tables:

- `users` - User information from Google OAuth
- `courts` - Court definitions
- `time_slots` - Available time slots
- `reservations` - Future court reservations
- `court_sessions` - Active court usage sessions

## Security

- JWT tokens for API authentication
- Session-based OAuth flow
- User-specific data isolation
- Secure credential management

## Next Steps

1. **Set up Google OAuth credentials** following the instructions above
2. **Test the authentication flow** by signing in with Google
3. **Test court reservations** and immediate usage features
4. **Deploy to production** with proper environment variables

The application is now ready for use!
