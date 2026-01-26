import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Settings } from 'lucide-react';
import { chatService } from '../../services/chatService';

export function Header() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const conversations = await chatService.getConversations();
      const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (e) {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/messages')) {
      fetchUnreadCount();
    }
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ to, icon: Icon, badge, title }) => (
    <Link
      to={to}
      className={`relative p-3 rounded-xl transition-all duration-200 ${
        isActive(to)
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
      title={title}
    >
      <Icon className="w-5 h-5" />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-100/50 dark:border-slate-800/50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-button">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Vibes</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to="/messages" icon={MessageCircle} badge={unreadCount} title="Messages" />
          <NavLink to="/settings" icon={Settings} title="Settings" />
        </nav>
      </div>
    </header>
  );
}
