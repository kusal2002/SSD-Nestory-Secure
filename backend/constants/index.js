// Application Constants

// User Roles
exports.USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// HTTP Status Codes
exports.HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Token Expiry
exports.TOKEN_EXPIRY = {
  ACCESS_TOKEN: '30d',
  REFRESH_TOKEN: '90d'
};

// Pagination
exports.PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Validation Messages
exports.VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters long',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists with this email',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Not authorized to access this resource',
  FORBIDDEN: 'Access forbidden'
};
