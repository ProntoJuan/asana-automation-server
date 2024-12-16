export const asanaAuthFailHandler = (req, res) => {
  console.log('called back successfully')
  // Successful authentication, redirect home.
  res.redirect('/api/users/me')
}
