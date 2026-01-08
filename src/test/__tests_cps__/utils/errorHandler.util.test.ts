import { handleApiError, handleGroupDeleteError } from '../../../utils/errorHandler';

const err = (status?: number, message?: string) => ({
  response: status !== undefined ? { status, data: message ? { message } : {} } : undefined,
});

describe('utils/errorHandler - handleApiError', () => {
  it('returns correct messages by status codes', () => {
    expect(handleApiError(err(403) as any)).toMatch(
      /permission|no permission|you do not have permission/i,
    );
    expect(handleApiError(err(404) as any)).toMatch(/not found/i);
    expect(handleApiError(err(400) as any)).toMatch(/invalid|message/i);
    expect(handleApiError(err(401) as any)).toMatch(/session expired|log in/i);
    expect(handleApiError(err(500) as any)).toMatch(/server error|server/i);
  });

  it('returns backend message when present', () => {
    expect(handleApiError(err(400, 'Lỗi custom') as any)).toBe('Lỗi custom');
  });

  it('returns network error message when no response', () => {
    expect(handleApiError({} as any)).toMatch(/unable to connect to server|network connection/i);
  });

  it('returns generic error.message when provided', () => {
    // Provide an empty response to avoid triggering the network error branch
    expect(handleApiError({ message: 'Oops', response: {} } as any)).toBe('Oops');
  });

  it('falls back to default message', () => {
    // Provide an empty response so it doesn't hit the network error branch
    expect(handleApiError({ response: {} } as any, 'Mặc định')).toBe('Mặc định');
  });
});

describe('utils/errorHandler - handleGroupDeleteError', () => {
  it('group delete specific messages', () => {
    expect(handleGroupDeleteError(err(403) as any)).toMatch(
      /do not have permission to delete this group/i,
    );
    expect(handleGroupDeleteError(err(404) as any)).toMatch(/group not found/i);
    expect(handleGroupDeleteError(err(400) as any)).toMatch(/invalid group id/i);
  });

  it('delegates to general handler for others', () => {
    expect(handleGroupDeleteError(err(500) as any)).toMatch(
      /unable to delete group|server error/i,
    );
  });
});
