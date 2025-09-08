export class HttpException extends Error {
  constructor(message, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export function errorHandler(err, req, res, _next) {
  const status = err?.statusCode || 500;
  const response = {
    error: {
      code: err?.errorCode || 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'An unexpected error occurred.'
    }
  };

  req?.log?.error('exception_caught', { status, ...response.error });

  res.status(status).json(response);
}
