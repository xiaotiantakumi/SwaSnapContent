import { useState, useEffect } from 'react';

interface ScrollToTopButtonProps {
  threshold?: number;
}

/**
 * スクロール位置に基づいて表示される「トップに戻る」ボタン
 * モバイルファーストで設計、長いコンテンツでのナビゲーション改善
 */
export function ScrollToTopButton({ threshold = 300 }: ScrollToTopButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setShowButton(scrollPosition > threshold);
    };

    // 初期チェック
    handleScroll();

    // スクロールイベントリスナー追加
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!showButton) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 z-50 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
      style={{ minWidth: '48px', minHeight: '48px' }} // 十分なタッチターゲット
      aria-label="ページトップに戻る"
      title="ページトップに戻る"
      data-testid="scroll-to-top"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}