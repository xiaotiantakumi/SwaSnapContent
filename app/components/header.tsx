interface HeaderProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export default function Header({ 
  title, 
  description, 
  showBackButton = false
}: HeaderProps = {}) {
  return (
    <header className="w-full max-w-3xl">
      {showBackButton && (
        <div className="mb-4">
          <a 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            data-testid="back-to-home"
          >
            ← アプリ選択に戻る
          </a>
        </div>
      )}
      
      {title && (
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      )}
      {description && (
        <p className="text-center text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </header>
  );
}
