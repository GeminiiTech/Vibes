import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { Avatar } from '../components/common/Avatar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatMessageTime, formatDateHeader, cn } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

export function Chat() {
  const { showError } = useToast();
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingStateRef = useRef(false);

  const otherUser = location.state?.otherUser || {};
  const currentUserId = authService.getCurrentUserId();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    chatService.connectWebSocket(conversationId).catch(console.error);

    const removeListener = chatService.addMessageListener((data) => {
      switch (data.type) {
        case 'new_message':
          if (data.message) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === data.message.id);
              if (exists) return prev;
              return [...prev, data.message];
            });

            if (Number(data.message.sender_id) !== Number(currentUserId)) {
              chatService.markReadViaWS();
            }
          }
          break;

        case 'typing':
          if (Number(data.user_id) !== Number(currentUserId)) {
            setIsOtherTyping(data.is_typing);
          }
          break;

        case 'messages_read':
          break;
      }
    });

    return () => {
      removeListener();
      chatService.disconnectWebSocket();
    };
  }, [conversationId, currentUserId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    const isTyping = e.target.value.length > 0;
    if (isTyping !== lastTypingStateRef.current) {
      lastTypingStateRef.current = isTyping;
      chatService.sendTypingIndicator(isTyping);
    }

    clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTypingIndicator(false);
        lastTypingStateRef.current = false;
      }, 3000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;

    setMessageInput('');
    lastTypingStateRef.current = false;
    chatService.sendTypingIndicator(false);

    chatService.sendMessageViaWS(content);
  };

  const shouldShowDateHeader = (index) => {
    if (index === 0) return true;
    const current = messages[index]?.created_at;
    const previous = messages[index - 1]?.created_at;
    if (!current || !previous) return false;

    const currentDate = new Date(current).toDateString();
    const previousDate = new Date(previous).toDateString();
    return currentDate !== previousDate;
  };

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadMessages} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="card px-4 py-3 flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar
          src={otherUser?.profile_picture}
          name={otherUser?.username}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {otherUser?.fullname || 'Unknown'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            @{otherUser?.username}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = Number(msg.sender_id) === Number(currentUserId);
            const showDateHeader = shouldShowDateHeader(index);

            return (
              <div key={msg.id}>
                {showDateHeader && (
                  <div className="text-center py-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {formatDateHeader(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'flex',
                    isMe ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm',
                      isMe
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                    )}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Message"
                        className="rounded-lg mb-2 max-w-full"
                      />
                    )}
                    {msg.content && (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                    <p
                      className={cn(
                        'text-[10px] mt-1.5 text-right',
                        isMe ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="card mt-4 p-3 flex items-center gap-3"
      >
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
        />
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl transition-all hover:shadow-button disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
