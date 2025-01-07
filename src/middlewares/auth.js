function checkAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('Authenticated check')
    return next()
  }
  res.redirect('/login')
}

export { checkAuthenticated }
