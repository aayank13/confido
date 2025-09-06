"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './utils/supabase/client';
import { Github } from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        router.push('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Error signing in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground>
        <div className="min-h-screen flex flex-col">
          {/* Navigation */}
          <nav className="flex justify-between items-center p-6 md:p-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold">Confido</span>
            </div>
          </nav>

          {/* Hero Section */}
          <main className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Master Your Voice with
                <span className="block bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Coaching
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Confido helps you build confidence and improve your communication skills through 
                interactive AI conversations. Practice interviews, presentations, and everyday conversations 
                with our advanced voice agent technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => signInWithProvider('google')}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                
                <button
                  onClick={() => signInWithProvider('github')}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 border border-gray-600"
                >
                  <Github className="w-5 h-5" />
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Real-time Voice Coaching</h3>
                  <p className="text-gray-400">Practice with AI agents that provide instant feedback on your speaking skills.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Specialized Coaches</h3>
                  <p className="text-gray-400">Choose from interview prep, public speaking, or conversation practice agents.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-gray-400">Monitor your improvement with detailed analytics and conversation history.</p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="p-6 text-center text-gray-400">
            <p>&copy; 2024 Confido. AI-powered voice coaching for everyone.</p>
          </footer>
        </div>
      </AnimatedBackground>
    </div>
  );
}
