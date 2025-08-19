import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes
const protect = async (req, res, next) => {
  let token;

  try {
    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route. No token provided.' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password! Please log in again.'
        });
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;
      res.locals.user = currentUser;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route. Invalid token.' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error authenticating user.'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export { protect, authorize };
