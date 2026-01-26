import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { formatTimeAgo, cn } from '../../utils/helpers';

export function PostCard({
  post,
  onLike,
  onComment,
  onUserClick,
}) {
  const {
    id,
    user,
    user_id,
    user_fullname,
    user_profile_picture,
    content,
    image,
    created_at,
    likes_count,
    comments_count,
    liked_by_user,
  } = post;

  return (
    <article className="card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Link to={`/profile/${user_id}`} onClick={onUserClick}>
          <Avatar
            src={user_profile_picture}
            name={user}
            size="md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${user_id}`}
              onClick={onUserClick}
              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {user_fullname}
            </Link>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {formatTimeAgo(created_at)}
            </span>
          </div>
          <Link
            to={`/profile/${user_id}`}
            onClick={onUserClick}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            @{user}
          </Link>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {content && (
        <div className="px-4 pb-3">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      )}

      {/* Image */}
      {image && (
        <div className="relative mx-4 mb-4 rounded-xl overflow-hidden">
          <img
            src={image}
            alt="Post"
            className="w-full object-cover max-h-[400px]"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onLike}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
            liked_by_user
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          )}
        >
          <Heart className={cn('w-5 h-5 transition-transform', liked_by_user && 'fill-current scale-110')} />
          <span className="text-sm font-medium">{likes_count}</span>
        </button>

        <button
          onClick={onComment}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{comments_count}</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
