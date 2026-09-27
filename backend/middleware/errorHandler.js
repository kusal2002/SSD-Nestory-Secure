const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to server console for server-side monitoring
  console.error('[SERVER ERROR]', err);

  // Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID or resource not found';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Determine safe status code and sanitized client message
  const statusCode = error.statusCode || (err.statusCode || 500);
  const clientMessage = statusCode === 500
    ? 'An unexpected error occurred on the server. Please try again later.'
    : (error.message || 'Invalid request');

  res.status(statusCode).json({
    success: false,
    message: clientMessage
  });
};

module.exports = errorHandler;
