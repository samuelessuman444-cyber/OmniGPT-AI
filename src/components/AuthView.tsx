import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { UserAccount } from '../types/gengpt';
import { GenGPTIcon } from './GenGPTIcon';

interface AuthViewProps {
  onSuccess: (user: UserAccount) => void;
  onBack: () => void;
}

const USERS_KEY = 'omnigpt_users';

interface StoredUser extends UserAccount {
  password: string;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBack }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const users = loadUsers();

    if (tab === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      if (users.some((u) => u.email === cleanEmail)) {
        setError('An account with this email already exists. Please log in.');
        return;
      }
      const newUser: StoredUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        password,
      };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
      onSuccess({ id: newUser.id, name: newUser.name, email: newUser.email });
      return;
    }

    const found = users.find(
      (u) => u.email === cleanEmail && u.password === password
    );
    if (!found) {
      setError('Invalid email or password. Try signing up or click Try Demo.');
      return;
    }
    onSuccess({ id: found.id, name: found.name, email: found.email });
  };

  const handleDemo = () => {
    onSuccess({
      id: 'demo_user',
      name: 'Demo User',
      email: 'demo@omnigpt.local',
      isDemo: true,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5d5d67] dark:text-[#9a9aa6] hover:text-[#0d0d0d] dark:hover:text-white mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="p-6 sm:p-7 rounded-2xl border border-black/10 dark:border-white/12 bg-[#f9f9f9] dark:bg-[#171717]">
          <div className="flex flex-col items-center text-center mb-6">
            <GenGPTIcon size={36} className="text-[#0d0d0d] dark:text-white mb-3" />
            <h1 className="text-xl font-semibold tracking-tight">
              {tab === 'login' ? 'Welcome back to OmniGPT' : 'Create your OmniGPT account'}
            </h1>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-lg bg-black/6 dark:bg-white/8 mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-1.5 rounded-md transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#6e6e80] dark:text-[#9a9aa6]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError('');
              }}
              className={`py-1.5 rounded-md transition-colors cursor-pointer ${
                tab === 'signup'
                  ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#6e6e80] dark:text-[#9a9aa6]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kwame Mensah"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#212121] border border-black/12 dark:border-white/12 focus:outline-none focus:border-[#10a37f]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#212121] border border-black/12 dark:border-white/12 focus:outline-none focus:border-[#10a37f]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-[#212121] border border-black/12 dark:border-white/12 focus:outline-none focus:border-[#10a37f]"
                required
              />
            </div>

            {error && <div className="text-xs text-red-500">{error}</div>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {tab === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-black/8 dark:border-white/10">
            <button
              type="button"
              onClick={handleDemo}
              className="w-full py-2.5 rounded-xl text-sm font-medium border border-black/12 dark:border-white/15 hover:bg-black/4 dark:hover:bg-white/6 transition-colors cursor-pointer"
            >
              Try Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
