'use client';

import React from 'react';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import RegistrationForm from '../components/RegistrationForm';

export default function RegisterPage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Header
          title="あたらしく とうろく"
          description="なまえ・アバター・あいことばを えらんでね"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />
        <RegistrationForm />
      </div>
    </main>
  );
}
