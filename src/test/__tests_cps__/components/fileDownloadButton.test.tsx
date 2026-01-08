import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDownloadButton from '../../../components/FileDownloadButton';
import { useFileDownload } from '../../../hooks/useFileDownload';

jest.mock('../../../hooks/useFileDownload');

const mockUseFileDownload = useFileDownload as jest.MockedFunction<typeof useFileDownload>;

describe('FileDownloadButton component', () => {
  const mockDownloadFile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFileDownload.mockReturnValue({
      downloadFile: mockDownloadFile,
      loading: false,
      error: null,
    });
  });

  it('should render button variant by default', () => {
    render(<FileDownloadButton fileId="file-123" fileName="test.pdf" />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/Download/i)).toBeInTheDocument();
  });

  it('should render icon variant when specified', () => {
    render(<FileDownloadButton fileId="file-123" fileName="image.png" variant="icon" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Download image.png');
  });

  it('should call downloadFile when button is clicked', async () => {
    mockDownloadFile.mockResolvedValue({ success: true });
    
    render(<FileDownloadButton fileId="file-456" fileName="document.docx" />);
    
    const button = screen.getByRole('button', { name: /Download/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadFile).toHaveBeenCalledWith('file-456', 'document.docx');
    });
  });

  it('should show loading state during download', () => {
    mockUseFileDownload.mockReturnValue({
      downloadFile: mockDownloadFile,
      loading: true,
      error: null,
    });

    render(<FileDownloadButton fileId="file-789" variant="button" />);
    
    expect(screen.getByText(/Downloading/i)).toBeInTheDocument();
  });

  it('should disable button when loading', () => {
    mockUseFileDownload.mockReturnValue({
      downloadFile: mockDownloadFile,
      loading: true,
      error: null,
    });

    render(<FileDownloadButton fileId="file-loading" fileName="loading.txt" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should call onDownloadSuccess callback after successful download', async () => {
    mockDownloadFile.mockResolvedValue({ success: true });
    const onSuccess = jest.fn();
    
    render(
      <FileDownloadButton 
        fileId="file-success" 
        fileName="success.txt" 
        onDownloadSuccess={onSuccess} 
      />
    );
    
    const button = screen.getByRole('button', { name: /Download/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should handle download error gracefully', async () => {
    mockDownloadFile.mockRejectedValue(new Error('Download failed'));
    
    render(<FileDownloadButton fileId="file-error" fileName="error.txt" />);
    
    const button = screen.getByRole('button', { name: /Download/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadFile).toHaveBeenCalled();
      // Component doesn't log error, error is handled in hook
    });
  });

  it('should apply custom className', () => {
    render(<FileDownloadButton fileId="file-123" className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should show loading spinner in icon variant', () => {
    mockUseFileDownload.mockReturnValue({
      downloadFile: mockDownloadFile,
      loading: true,
      error: null,
    });

    render(<FileDownloadButton fileId="file-icon" variant="icon" fileName="icon.jpg" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Loading...');
  });
});
