// Rate Limiter — Set to virtually unlimited for smooth user experience
function rateLimiter(req, res, next) {
  // Pass through all requests cleanly without showing rate limit errors to users
  next();
}

module.exports = rateLimiter;
