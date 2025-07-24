'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  clientPrincipal: {
    userId: string;
    userRoles: string[];
    identityProvider: string;
    userDetails: string;
  } | null;
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/.auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const isAuthenticated = !!user?.clientPrincipal;
  const userEmail = user?.clientPrincipal?.userDetails || '';
  const userRoles = user?.clientPrincipal?.userRoles || [];

  const login = () => {
    window.location.href = '/.auth/login/aad';
  };

  const logout = () => {
    window.location.href = '/.auth/logout?post_logout_redirect_uri=' + 
                         encodeURIComponent(window.location.origin);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    userEmail,
    userRoles,
    login,
    logout
  };
}