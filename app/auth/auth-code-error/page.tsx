"use client";

import { useRouter } from 'next/navigation';

export default function AuthCodeError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-400 mb-6">
          There was an issue with the authentication process. Please try signing in again.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
