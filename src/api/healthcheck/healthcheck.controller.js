export function healthcheckHandler (req, res) {
  res.status(200).json({ message: 'Ok', uptime: process.uptime() })
}
