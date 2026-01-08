import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpButton from '../../../components/HelpButton/HelpButton';

// Stub child modals to reduce render cost
jest.mock('../../../components/HelpButton/GuideModal', () => ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Guide Modal</div> : null);
jest.mock('../../../components/HelpButton/AIChatModal', () => ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>AI Chat Modal</div> : null);

describe('components/HelpButton/HelpButton render', () => {
  it('toggles menu and opens modals', () => {
    render(<HelpButton />);
    const btn = screen.getByRole('button', { name: /help/i });
    fireEvent.click(btn);
    // menu appears with items
    fireEvent.click(screen.getByText('Trợ lý AI'));
    expect(screen.getByText('AI Chat Modal')).toBeInTheDocument();

    fireEvent.click(btn);
    fireEvent.click(screen.getByText('Hướng dẫn'));
    expect(screen.getByText('Guide Modal')).toBeInTheDocument();
  });
});
