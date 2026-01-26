import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Inbox } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Avatar } from '../components/common/Avatar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatConversationTime } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

export function Conversations() {
  const { showError } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadConversations} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Messages</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No messages yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Start a conversation from someone's profile</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {conversations.map((conv) => {
            const other = conv.other_participant;
            const lastMsg = conv.last_message;
            const unreadCount = conv.unread_count || 0;

            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                state={{ otherUser: other }}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="relative">
                  <Avatar
                    src={other?.profile_picture}
                    name={other?.username}
                    size="md"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`font-semibold truncate ${
                        unreadCount > 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {other?.fullname || 'Unknown'}
                    </h3>
                    <span
                      className={`text-xs flex-shrink-0 ${
                        unreadCount > 0 ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatConversationTime(lastMsg?.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-sm truncate ${
                        unreadCount > 0
                          ? 'text-slate-700 dark:text-slate-200 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {lastMsg?.content || 'No messages yet'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
