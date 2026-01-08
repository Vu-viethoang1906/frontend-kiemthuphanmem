import { useState, useCallback, useRef, useEffect } from 'react';
import { useUrlState } from './useUrlState';

/**
 * Hook để xử lý tìm kiếm tiếng Việt đúng cách
 * Xử lý composition events để tránh lỗi khi gõ tiếng Việt
 */
export const useVietnameseSearch = (initialState: any) => {
  const [urlState, setUrlState] = useUrlState(initialState);
  const [searchValue, setSearchValue] = useState(urlState.q || "");
  const [isComposing, setIsComposing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with URL state
  useEffect(() => {
    setSearchValue(urlState.q || "");
  }, [urlState.q]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce search to avoid too many updates
    debounceRef.current = setTimeout(() => {
      setUrlState({ ...urlState, q: value, page: "1" });
    }, 300);
  }, [urlState, setUrlState]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    // Update search value after composition ends
    handleSearchChange(e.currentTarget.value);
  }, [handleSearchChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Only update URL state if not composing (for Vietnamese input)
    if (!isComposing) {
      handleSearchChange(value);
    }
  }, [isComposing, handleSearchChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    searchValue,
    searchTerm: urlState.q || "",
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleSearchChange
  };
};