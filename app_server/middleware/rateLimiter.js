// In-Memory Multi-Tier Rate Limiter & Anti-Spam Middleware

class MemoryRateLimiter {
  constructor(windowMs, maxRequests, message) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message || 'Too many requests. Please slow down and try again later.';
    this.hits = new Map();

    // Periodic cleanup of expired records every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  getKey(req) {
    // Combine IP + authenticated user if available
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.socket?.remoteAddress ||
               req.ip ||
               'unknown_ip';
    const user = req.user?.username ? `_usr_${req.user.username}` : '';
    return `${ip}${user}`;
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      const timestamps = this.hits.get(key) || [];
      const valid = timestamps.filter(t => now - t < this.windowMs);

      if (valid.length >= this.maxRequests) {
        const oldest = valid[0];
        const retryAfterSec = Math.ceil((this.windowMs - (now - oldest)) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: this.message,
          retryAfter: retryAfterSec
        });
      }

      valid.push(now);
      this.hits.set(key, valid);
      next();
    };
  }
}

// 1. General API limiter: 150 requests per 1 minute
const generalLimiter = new MemoryRateLimiter(
  60 * 1000,
  150,
  'Too many API requests. Please wait a moment.'
);

// 2. Auth limiter: 10 attempts per 3 minutes (brute-force defense)
const authLimiter = new MemoryRateLimiter(
  3 * 60 * 1000,
  10,
  'Too many login/registration attempts. Please wait 3 minutes before trying again.'
);

// 3. File & Message sending limiter: 15 sends per 1 minute (anti-spam defense)
const sendLimiter = new MemoryRateLimiter(
  60 * 1000,
  15,
  'Transmission rate limit reached. Please wait before sending more files.'
);

module.exports = generalLimiter.middleware();
module.exports.rateLimiter = generalLimiter.middleware();
module.exports.authLimiter = authLimiter.middleware();
module.exports.sendLimiter = sendLimiter.middleware();
