'use client';

import Link from 'next/link';

interface AppOption {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

const apps: AppOption[] = [
  {
    title: 'URL本文抽出',
    description: 'URLからウェブページの本文を抽出し、読みやすく表示します',
    href: '/url-extractor',
    icon: '🌐',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Markdownビューア',
    description: 'Markdownファイルをリアルタイムでプレビューできるエディタです',
    href: '/markdown-viewer',
    icon: '📝',
    color: 'bg-green-500 hover:bg-green-600',
  },
];

export default function AppSelector() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {apps.map((app) => (
        <Link
          key={app.href}
          href={app.href}
          className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-start space-x-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${app.color} text-white transition-colors`}>
              <span className="text-2xl">{app.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300">
                {app.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {app.description}
              </p>
            </div>
            
            <div className="text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-500">
              →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}