import { Suspense } from 'react';

import ExtractForm from '../components/extract-form';
import Header from '../components/header';
import ThemeToggle from '../components/theme-toggle';

export default function UrlExtractorPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Top navigation bar with theme toggle */}
      <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-end">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
        <Header 
          title="URL本文抽出アプリ"
          description="URLを入力して、ウェブページから本文を抽出"
          showBackButton={true}
        />
        <div className="mt-8 w-full max-w-3xl">
          <Suspense fallback={<div className="text-center">読み込み中...</div>}>
            <ExtractForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}