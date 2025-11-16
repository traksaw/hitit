const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true }, // Ensure req is passed
      async (req, email, password, done) => {
        try {
          console.log('Passport LocalStrategy: Checking req.session...');
          console.log('req.session:', req.session); // Should NOT be undefined here

          if (!req.session) {
            console.error('ERROR: req.session is undefined in Passport!');
            return done(null, false, { msg: 'Session is not initialized.' });
          }

          const user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            return done(null, false, { msg: `Email ${email} not found.` });
          }

          user.comparePassword(password, (err, isMatch) => {
            if (err) return done(err);
            return isMatch
              ? done(null, user)
              : done(null, false, { msg: 'Invalid email or password.' });
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
