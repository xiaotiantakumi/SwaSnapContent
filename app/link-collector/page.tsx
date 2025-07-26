import { Suspense } from 'react';
import Header from '../components/header';
import LinkCollectorClient from './link-collector-client';
import ThemeToggle from '../components/theme-toggle';

export default function LinkCollectorPage() {
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
          title="リンクコレクター"
          description="ウェブページから複数のURLを効率的に収集し、NotebookLM用に整理します"
          showBackButton={true}
        />
        <div className="w-full max-w-4xl mt-8">
          <Suspense fallback={<div className="text-center">読み込み中...</div>}>
            <LinkCollectorClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}