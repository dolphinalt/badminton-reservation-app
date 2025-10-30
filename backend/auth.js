const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function setupAuth(database) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'https://api.ethanzhao.us'}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists in database
      const existingUser = await database.get(
        `SELECT * FROM users WHERE google_id = ?`, 
        [profile.id]
      );
      
      if (existingUser) {
        return done(null, existingUser);
      } else {
        // Create new user
        const newUser = {
          google_id: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value
        };
        
        const result = await database.run(
          `INSERT INTO users (google_id, name, email, avatar) VALUES (?, ?, ?, ?)`,
          [newUser.google_id, newUser.name, newUser.email, newUser.avatar]
        );
        
        newUser.id = result.id;
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await database.get(
        `SELECT * FROM users WHERE id = ?`, 
        [id]
      );
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

module.exports = setupAuth;