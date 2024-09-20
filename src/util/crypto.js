import crypto from 'crypto'

export function verifySignature (xHookSignature, body, secret) {
  const computedSignature = crypto
    .createHmac('SHA256', secret)
    .update(JSON.stringify(body))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(xHookSignature),
    Buffer.from(computedSignature)
  )
}
