import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handleClick = (page: number) => {
    if (page !== currentPage && page > 0 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn${i === currentPage ? " active" : ""}`}
          onClick={() => handleClick(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <button
        className="pagination-btn"
        onClick={() => handleClick(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
      {renderPages()}
      <button
        className="pagination-btn"
        onClick={() => handleClick(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
