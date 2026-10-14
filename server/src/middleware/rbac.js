/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specific roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification',
        errors: ['Not authenticated'],
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
        errors: ['Insufficient permissions'],
      });
    }

    next();
  };
};

module.exports = { authorize };
