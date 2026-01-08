import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastNotification from '../../../components/ToastNotification';

describe('components/ToastNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders message and description', () => {
    const onClose = jest.fn();
    render(<ToastNotification message="Saved" description="Item stored" onClose={onClose} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Item stored')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('auto closes after 3 seconds', () => {
    const onClose = jest.fn();
    render(<ToastNotification message="Done" onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('manual close button triggers onClose immediately', async () => {
    const onClose = jest.fn();
    render(<ToastNotification message="Hello" onClose={onClose} />);

    const closeBtn = screen.getByRole('button');
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
