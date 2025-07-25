'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 現在のテーマ状態を確認（DOMの実際の状態を基準に）
    const currentIsDark = document.documentElement.classList.contains('dark');
    setIsDark(currentIsDark);
    
    // テーマ変更の監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDarkClass = document.documentElement.classList.contains('dark');
          setIsDark(hasDarkClass);
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    
    console.log('Theme toggle clicked:', { 
      current: isDark, 
      newTheme: newIsDark ? 'dark' : 'light',
      htmlClassBefore: document.documentElement.classList.contains('dark')
    });
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    console.log('Theme toggle applied:', {
      htmlClassAfter: document.documentElement.classList.contains('dark'),
      localStorageTheme: localStorage.getItem('theme')
    });
    
    setIsDark(newIsDark);
  };

  // サーバーサイドレンダリング時はボタンを表示しない
  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9"></div> // プレースホルダーでレイアウトシフトを防ぐ
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {isDark ? (
        // ライトモードアイコン（太陽）
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        // ダークモードアイコン（月）
        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}