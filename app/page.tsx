import { Suspense } from 'react';
import ExtractForm from './components/extract-form';
import Header from './components/header';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <Header />
      <div className="w-full max-w-3xl mt-8">
        {/* 
          Suspenseは現在は主に将来的な拡張性のために使用
          - 将来的にExtractFormがServer Componentを含む可能性に備える
          - 追加されるUI要素の遅延ロードに対応するため
        */}
        <Suspense fallback={<div className="text-center">読み込み中...</div>}>
          <ExtractForm />
        </Suspense>
      </div>
    </main>
  );
}
