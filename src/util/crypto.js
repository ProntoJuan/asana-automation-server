import crypto from 'crypto'

export function verifySignature (xHookSignature, body, secret) {
  // timingSafeEqual throws on a missing value or a length mismatch, which used
  // to escape as an unhandled error and leave Asana's request hanging. A bad or
  // absent signature is simply an unverified request.
  if (!xHookSignature || !secret) return false

  const computedSignature = crypto
    .createHmac('SHA256', secret)
    .update(JSON.stringify(body))
    .digest('hex')

  const received = Buffer.from(xHookSignature)
  const computed = Buffer.from(computedSignature)

  if (received.length !== computed.length) return false

  return crypto.timingSafeEqual(received, computed)
}
