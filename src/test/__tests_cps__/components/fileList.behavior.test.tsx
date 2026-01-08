import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../test-utils/msw.server';

// Mock toast (FileList imports default `toast`)
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: (...a: any[]) => mockToastSuccess(...a), error: (...a: any[]) => mockToastError(...a) } }));

// Mock ModalProvider confirm (we only need confirm for delete flows)
const mockConfirm = jest.fn();
jest.mock('../../../components/ModalProvider', () => ({ useModal: () => ({ confirm: mockConfirm, show: jest.fn() }) }));

import FileList from '../../../components/FileList';

const API = 'http://localhost:3005/api';

interface TestFile {
  _id: string;
  original_name: string;
  size: number;
  mime_type?: string;
  download_count?: number;
  uploaded_by: { _id: string; username: string } | string;
  uploaded_at: string;
  file_id?: string;
}

let files: TestFile[] = [];
let taskId = 't123';

function applyHandlers() {
  server.use(
    rest.get(`${API}/files/task/:tid`, (req, res, ctx) => {
      // Return empty for unmatched task id
      const tid = req.params.tid as string;
      const data = tid === taskId ? files : [];
      return res(ctx.status(200), ctx.json({ data }));
    }),
    rest.get(`${API}/files/:fid/download`, (req, res, ctx) => {
      const fid = req.params.fid as string;
      files = files.map(f => (f._id === fid ? { ...f, download_count: (f.download_count || 0) + 1 } : f));
      const blob = new Blob(['file-content'], { type: 'text/plain' });
      return res(
        ctx.status(200),
        ctx.set('Content-Type', 'text/plain'),
        ctx.set('Content-Disposition', 'attachment; filename="example.txt"'),
        ctx.body(blob)
      );
    }),
    rest.delete(`${API}/files/:fid`, (req, res, ctx) => {
      const fid = req.params.fid as string;
      // Allow an error scenario by special id
      if (fid === 'error-file') {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      }
      files = files.filter(f => f._id !== fid);
      return res(ctx.status(200), ctx.json({ success: true }));
    })
  );
}

const renderList = (props: Partial<React.ComponentProps<typeof FileList>> = {}) => {
  return render(<FileList taskId={taskId} {...props} />);
};

describe('FileList behavior', () => {
  beforeEach(() => {
    // Reset storage and mocks
    localStorage.clear();
    localStorage.setItem('userId', 'u1');
    localStorage.setItem('roles', JSON.stringify([]));
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(true); // default allow
    files = [
      {
        _id: 'f1',
        original_name: 'Specs.docx',
        size: 2048,
        mime_type: 'application/msword',
        download_count: 0,
        uploaded_by: { _id: 'u1', username: 'alice' },
        uploaded_at: new Date().toISOString()
      },
      {
        _id: 'f2',
        original_name: 'Report.pdf',
        size: 4096,
        mime_type: 'application/pdf',
        download_count: 2,
        uploaded_by: { _id: 'u2', username: 'bob' },
        uploaded_at: new Date().toISOString()
      }
    ];
    applyHandlers();
  });

  it('shows loading spinner before files load', async () => {
    renderList();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Specs.docx')).toBeInTheDocument());
  });

  it('renders empty state when no files returned', async () => {
    files = []; // ensure empty
    renderList();
    await waitFor(() => expect(screen.getByText(/No attachments/i)).toBeInTheDocument());
  });

  it('lists file items with download & (uploader) delete buttons', async () => {
    renderList();
    await screen.findByText('Specs.docx');
    expect(screen.getByText('Report.pdf')).toBeInTheDocument();
    // uploader: file f1 uploaded_by u1 => delete button visible
    const deleteButtons = screen.getAllByRole('button', { name: /Delete file/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    // non-uploader file f2 should have no delete button if user not admin
    // Confirm only one delete for uploader
    expect(deleteButtons.length).toBe(1);
  });

  it('hides delete button for non-uploader non-admin file', async () => {
    // current user u1; file f2 uploaded_by u2, roles empty.
    renderList();
    await screen.findByText('Report.pdf');
    // Ensure there is no second delete button besides uploader's
    const allDeleteButtons = screen.getAllByRole('button', { name: /Delete file/i });
    expect(allDeleteButtons.length).toBe(1); // only uploader file
  });

  it('allows admin to delete any file', async () => {
    localStorage.setItem('roles', JSON.stringify(['admin']));
    renderList();
    await screen.findByText('Report.pdf');
    // Now both files should have delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /Delete file/i });
    expect(deleteButtons.length).toBe(2);
  });

  it('triggers download action (button clickable without crashing)', async () => {
    renderList();
    await screen.findByText('Specs.docx');
    const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
    userEvent.click(downloadButtons[0]);
    // Simply ensure component remains rendered and no crash (file still listed)
    await waitFor(() => expect(screen.getByText('Specs.docx')).toBeInTheDocument());
  });

  it('cancels deletion when confirm returns false', async () => {
    mockConfirm.mockResolvedValueOnce(false);
    renderList();
    await screen.findByText('Specs.docx');
    userEvent.click(screen.getByRole('button', { name: /Delete file/i }));
    // Wait a tick for potential state changes
    await waitFor(() => expect(screen.getByText('Specs.docx')).toBeInTheDocument());
    // Ensure still present
    expect(screen.getByText('Specs.docx')).toBeInTheDocument();
  });

  it('deletes file after confirmation and refreshes list', async () => {
    renderList();
    await screen.findByText('Specs.docx');
    userEvent.click(screen.getByRole('button', { name: /Delete file/i }));
    await waitFor(() => expect(screen.queryByText('Specs.docx')).not.toBeInTheDocument());
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('shows error toast when server deletion fails', async () => {
    files.push({
      _id: 'error-file',
      original_name: 'Broken.txt',
      size: 100,
      mime_type: 'text/plain',
      download_count: 0,
      uploaded_by: { _id: 'u1', username: 'alice' },
      uploaded_at: new Date().toISOString()
    });
    renderList();
    const brokenNameEl = await screen.findByText('Broken.txt');
    // File card container is ancestor two levels up until p->div.flex-1->div.card
    const card = brokenNameEl.closest('div')?.parentElement?.parentElement as HTMLElement;
    const deleteBtn = within(card).getByRole('button', { name: /Delete file/i });
    userEvent.click(deleteBtn);
    await waitFor(() => expect(screen.getByText('Broken.txt')).toBeInTheDocument());
    expect(mockToastError).toHaveBeenCalled();
  });
});
