'use client';

import { useState, useRef, useEffect } from 'react';

import { useAuth } from '../../hooks/useAuth';

export default function UserMenu() {
  const { isAuthenticated, isLoading, userEmail, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <span className="text-sm">...</span>
      </div>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="ログイン"
      >
        <span className="mr-2">👤</span>
        ログイン
      </button>
    );
  }

  // Authenticated - show user menu
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="ユーザーメニューを開く"
      >
        <span className="text-sm font-medium">{userInitial}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
          <div className="py-1">
            {/* User Info */}
            <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">ログイン中</p>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {userEmail}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="mr-2">🚪</span>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}