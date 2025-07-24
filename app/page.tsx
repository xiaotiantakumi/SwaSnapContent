import Header from './components/header';
import AppSelector from './components/app-selector';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
              おてて動かそうのツール
            </h1>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8 text-center">
              アプリケーションを選択してください
            </h2>
            <AppSelector />
          </div>
        </div>
      </div>
    </main>
  );
}
