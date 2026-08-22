/**
 * Standardized API response formatter helper
 */
class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const responsePayload = {
      success: true,
      message,
    };

    if (data !== null) {
      responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
  }

  static error(res, message = 'Error', statusCode = 500, errors = null) {
    const responsePayload = {
      success: false,
      message,
    };

    if (errors) {
      responsePayload.errors = errors;
    }

    return res.status(statusCode).json(responsePayload);
  }
}

module.exports = ApiResponse;
