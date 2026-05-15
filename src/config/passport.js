import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.HOST}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value ?? ''
  if (!email.endsWith('@prontomarketing.com')) {
    return done(null, false)
  }
  return done(null, {
    name: profile.displayName,
    email,
    photo: profile.photos?.[0]?.value
  })
}))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

export default passport
