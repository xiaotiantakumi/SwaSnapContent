import { Suspense } from 'react';
import Header from '../components/header';
import LinkCollectorClient from './link-collector-client';

export default function LinkCollectorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
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
    </main>
  );
}