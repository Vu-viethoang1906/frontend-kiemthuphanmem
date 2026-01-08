import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAvatarUser } from '../api/avataApi';
import { getMe } from '../api/authApi';

interface UserContextType {
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  refreshAvatar: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userAvatar, setUserAvatar] = useState<string>('/icons/g2.jpg');
  const [isLoading, setIsLoading] = useState(false);

  const loadAvatar = async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    try {
      setIsLoading(true);
      const me = await getMe();
      const userId = me?.success && me.data?._id
        ? me.data._id
        : localStorage.getItem('userId');

      if (!userId) {
        return;
      }
      
      const res = await fetchAvatarUser(userId);
      setUserAvatar(`${res.avatar_url}?t=${Date.now()}`);
    } catch (err) {
      console.error('❌ Lỗi khi tải avatar:', err);
      setUserAvatar('/icons/g2.jpg');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAvatar = async () => {
    await loadAvatar();
  };

  // Load avatar once when provider mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadAvatar();
    }
  }, []);

  // Listen for avatar-updated events
  useEffect(() => {
    const handleAvatarUpdate = (event: any) => {
      const newUrl = event?.detail?.avatar_url;
      if (newUrl) {
        setUserAvatar(`${newUrl}?t=${Date.now()}`);
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, []);

  return (
    <UserContext.Provider value={{ userAvatar, setUserAvatar, refreshAvatar }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
