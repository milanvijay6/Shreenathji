
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Shield, UserCheck, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SALES);
  const [name, setName] = useState('Demo User');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate auth delay
    setTimeout(() => {
      onLogin({
        id: `usr-${Date.now()}`,
        name: name,
        role: selectedRole,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">GlobalReach Login</h1>
          <p className="text-slate-500 mt-2">Secure Access Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Role (Demo)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(UserRole).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`
                    py-2 px-2 text-sm font-medium rounded-lg border transition-all
                    ${selectedRole === role 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {selectedRole === UserRole.ADMIN && 'Full access to settings, exports, and user management.'}
              {selectedRole === UserRole.SALES && 'Can chat with leads and run campaigns.'}
              {selectedRole === UserRole.VIEWER && 'Read-only access to dashboard and chats.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Sign In
              </span>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          Secured by Client-Side Auth Simulation
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
