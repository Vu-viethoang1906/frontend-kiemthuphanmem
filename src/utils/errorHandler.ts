/**
 * Error handler utility for API errors
 * Provides user-friendly error messages based on HTTP status codes
 */

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * Handle API errors and return user-friendly messages
 * @param error - The error object from API call
 * @param defaultMessage - Default message if no specific error message is found
 * @returns User-friendly error message
 */
export const handleApiError = (
  error: ApiError,
  defaultMessage: string = 'An error occurred',
): string => {
  // Handle 403 Forbidden - Permission denied
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action';
  }

  // Handle 404 Not Found
  if (error.response?.status === 404) {
    return 'Not found';
  }

  // Handle 400 Bad Request
  if (error.response?.status === 400) {
    return error.response?.data?.message || 'Invalid request data';
  }

  // Handle 401 Unauthorized
  if (error.response?.status === 401) {
    return 'Session expired. Please log in again';
  }

  // Handle 500 Internal Server Error
  if (error.response?.status === 500) {
    return 'Server error. Please try again later';
  }

  // Handle network errors
  if (!error.response) {
    return 'Unable to connect to server. Please check your network connection';
  }

  // Return specific error message from backend if available
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Return generic error message if available
  if (error.message) {
    return error.message;
  }

  // Return default message as fallback
  return defaultMessage;
};

/**
 * Handle specific group deletion errors
 * @param error - The error object from group deletion API call
 * @returns User-friendly error message for group deletion
 */
export const handleGroupDeleteError = (error: ApiError): string => {
  if (error.response?.status === 403) {
    return 'You do not have permission to delete this group. Only the group owner can delete it.';
  }

  if (error.response?.status === 404) {
    return 'Group not found';
  }

  if (error.response?.status === 400) {
    return 'Invalid group ID';
  }

  // Use the general error handler for other cases
  return handleApiError(error, 'Unable to delete group. An error occurred');
};
