import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, User, Lock, Bell, Info, HelpCircle, LogOut, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/authService';

export function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const currentUserId = authService.getCurrentUserId();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showComingSoon = () => {
    showInfo('Coming soon!');
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
      </div>

      {/* Navigation Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2 px-1">
          Navigation
        </h2>
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <Link to="/" className="settings-tile w-full">
            <div className="settings-icon">
              <Home className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Home</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">View your feed</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </Link>

          <Link to={`/profile/${currentUserId}`} className="settings-tile w-full">
            <div className="settings-icon">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Profile</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">View your profile</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2 px-1">
          Appearance
        </h2>
        <div className="card overflow-hidden">
          <button
            onClick={toggleTheme}
            className="settings-tile w-full"
          >
            <div className="settings-icon">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isDarkMode ? 'On' : 'Off'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme();
              }}
              className="toggle-switch"
              data-checked={isDarkMode}
              role="switch"
              aria-checked={isDarkMode}
            >
              <span className="toggle-switch-dot" />
            </button>
          </button>
        </div>
      </div>

      {/* Account Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2 px-1">
          Account
        </h2>
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <button onClick={showComingSoon} className="settings-tile w-full">
            <div className="settings-icon">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Privacy</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your privacy settings</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </button>

          <button onClick={showComingSoon} className="settings-tile w-full">
            <div className="settings-icon">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configure notification preferences</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2 px-1">
          About
        </h2>
        <div className="card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <button onClick={showComingSoon} className="settings-tile w-full">
            <div className="settings-icon">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">About Vibes</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Version 1.0.0</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </button>

          <button onClick={showComingSoon} className="settings-tile w-full">
            <div className="settings-icon">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800 dark:text-slate-100">Help & Support</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get help with Vibes</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
}
