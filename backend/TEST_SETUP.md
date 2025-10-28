# Test Configuration for Google OAuth

To test the Google OAuth functionality, you need to set up credentials. Here's what you need:

## Quick Test Setup

1. **Get Google OAuth Credentials:**

   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3001/auth/google/callback` as redirect URI

2. **Update Backend Environment:**

   ```bash
   cd backend
   # Edit .env file with your credentials:
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   JWT_SECRET=super_secret_jwt_key_make_it_long_and_random_123456789
   SESSION_SECRET=super_secret_session_key_also_long_and_random_987654321
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start Both Servers:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   node server.js

   # Terminal 2 - Frontend
   cd badminton-reserve-app
   npm run dev
   ```

4. **Test the Flow:**
   - Open http://localhost:5173
   - Click "Sign in with Google"
   - Complete Google OAuth
   - Test court reservations and taking courts

## Expected Behavior

- **Without Auth:** Shows login screen with court preview
- **With Auth:** Shows full court management interface
- **Court Taking:** 30-minute sessions, prevents other actions
- **Reservations:** Future time slots, one per user
- **Real-time:** Status updates every 5 seconds

## API Testing (with valid JWT token)

```bash
# Get courts status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/courts

# Take a court
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/courts/1/take

# Make a reservation
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d '{"courtId": 1, "timeSlot": "2:30 pm"}' http://localhost:3001/api/reservations
```

The system is ready for testing once Google OAuth credentials are configured!
