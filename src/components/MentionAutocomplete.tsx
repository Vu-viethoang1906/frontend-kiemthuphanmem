import React, { useState, useEffect, useRef } from 'react';

interface User {
  _id: string;
  username: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  displayName: string;
}

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: User) => void;
  users: User[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  users,
  textareaRef,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Kiểm tra xem có khoảng trắng sau @ không (nếu có thì không phải mention)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.toLowerCase();
        const filtered = users.filter(
          (user) =>
            user.username?.toLowerCase().includes(query) ||
            user.full_name?.toLowerCase().includes(query) ||
            user.displayName?.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
          setMentionStart(lastAtIndex);
          setSuggestions(filtered);
          setShowSuggestions(true);
          setSelectedIndex(0);
          return;
        }
      }
    }

    setShowSuggestions(false);
    setSuggestions([]);
    setMentionStart(null);
  }, [value, users, textareaRef]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!showSuggestions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelectUser(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => {
        textarea.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectUser = (user: User) => {
    if (!textareaRef.current || mentionStart === null) return;

    const textarea = textareaRef.current;
    const textBeforeMention = value.substring(0, mentionStart);
    const textAfterMention = value.substring(textarea.selectionStart);
    const newValue = `${textBeforeMention}@${user.username} ${textAfterMention}`;

    onChange(newValue);
    onSelect(user);
    setShowSuggestions(false);
    setMentionStart(null);

    // Focus lại textarea và đặt cursor sau mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 2; // +2 cho @ và space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  // Calculate position for dropdown
  const getDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    // Calculate approximate position
    const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
    const lines = textBeforeAt.split('\n');
    const lineNumber = lines.length - 1;
    const lineText = lines[lines.length - 1];

    // Approximate character width (this is a rough estimate)
    const charWidth = 8;
    const lineHeight = 20;

    return {
      top: rect.top + lineNumber * lineHeight + lineHeight + 4,
      left: rect.left + lineText.length * charWidth,
    };
  };

  const position = getDropdownPosition();

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: 'white',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      {suggestions.map((user, index) => (
        <div
          key={user._id}
          onClick={() => handleSelectUser(user)}
          onMouseEnter={() => setSelectedIndex(index)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex ? '#f0f0f0' : 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.displayName}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#4285f4',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {(user.displayName || user.username || 'U')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#202124',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.displayName || user.username}
            </div>
            {user.username && user.full_name && user.username !== user.full_name && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#5f6368',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                @{user.username}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionAutocomplete;
