const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Support multiple token locations
    let token = null;
    if (req.header('Authorization')) token = req.header('Authorization').replace('Bearer ', '');
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];
    if (!token && req.body && req.body.token) token = req.body.token;
    if (!token && req.query && req.query.token) token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

  // For debugging only: show whether a token was received
  // console.debug('auth middleware token present:', Boolean(token));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;