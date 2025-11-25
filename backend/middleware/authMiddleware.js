const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from headers
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.user = { id: decoded.userId };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
