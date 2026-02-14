import jwt from 'jsonwebtoken';
import { User, Business } from '../models/index.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-__v');
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions' });
    }
    next();
  };
};

export const requireOwnerOrStaff = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const user = req.user;

    if (user.role === 'owner') {
      const business = await Business.findOne({ _id: businessId, owner: user._id });
      if (business) {
        req.isOwner = true;
        return next();
      }
    }

    if (user.role === 'staff') {
      const business = await Business.findOne({
        _id: businessId,
        'staff.user': user._id
      });
      if (business) {
        req.isStaff = true;
        return next();
      }
    }

    res.status(403).json({ success: false, message: 'Access denied. Not owner or staff of this business' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
