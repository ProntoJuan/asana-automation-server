import passport from 'passport'
import { Strategy as AsanaStrategy } from 'passport-asana'
import session from 'express-session'
import { asanaToken as token } from './asana.js'

// Settings
export const passportConfig = (app) => {
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((obj, done) => {
    done(null, obj)
  })

  passport.use(
    new AsanaStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: `${process.env.HOST}/auth/asana/callback` // must be registered as Redirect URI in Asana
      },
      function (accessToken, refreshToken, profile, done) {
        token.accessToken = accessToken
        console.log('got token')
        return done(null, profile)
      }
    )
  )

  app.use(session({
    secret: 'd00dc3df-5325-430a-9794-c2754c571d1a',
    saveUninitialized: true,
    resave: true
  }))

  // Initialize Passport! Also use passport.session() middleware, to support persistent login sessions (recommended).
  app.use(passport.initialize())
  app.use(passport.session())
}
