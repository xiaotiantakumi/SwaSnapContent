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
      className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-500 p-3 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-600 active:scale-95 active:bg-blue-700"
      style={{ minWidth: '48px', minHeight: '48px' }} // 十分なタッチターゲット
      aria-label="ページトップに戻る"
      title="ページトップに戻る"
      data-testid="scroll-to-top"
    >
      <svg
        className="size-5"
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