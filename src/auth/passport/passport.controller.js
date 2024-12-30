export const asanaAuthFailHandler = (req, res) => {
  console.log('called back successfully')
  // Successful authentication, redirect home.
  res.redirect(`${process.env.CLIENT}`)
}
