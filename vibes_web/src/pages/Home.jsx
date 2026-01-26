import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { PostCard } from '../components/post/PostCard';
import { PostCreator } from '../components/post/PostCreator';
import { CommentModal } from '../components/post/CommentModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { useToast } from '../contexts/ToastContext';

export function Home() {
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postingLoading, setPostingLoading] = useState(false);
  const [error, setError] = useState(null);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, postsData] = await Promise.all([
        authService.getUserProfile(),
        postService.getPosts(),
      ]);

      setProfile(profileData);
      setPosts(postsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePost = async (content, image) => {
    setPostingLoading(true);
    try {
      await postService.createPost(content, image);
      const newPosts = await postService.getPosts();
      setPosts(newPosts);
      showSuccess('Post created!');
    } catch (err) {
      showError('Failed to create post');
    } finally {
      setPostingLoading(false);
    }
  };

  const handleLike = async (postId, currentlyLiked) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user: !currentlyLiked,
            likes_count: currentlyLiked
              ? post.likes_count - 1
              : post.likes_count + 1,
          };
        }
        return post;
      })
    );

    try {
      if (currentlyLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (err) {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: currentlyLiked,
              likes_count: currentlyLiked
                ? post.likes_count + 1
                : post.likes_count - 1,
            };
          }
          return post;
        })
      );
      showError('Failed to update like');
    }
  };

  const handleOpenComments = async (post) => {
    setSelectedPost(post);
    setComments(post.comments || []);
    setCommentModalOpen(true);
  };

  const handleAddComment = async (text) => {
    if (!selectedPost) return;

    try {
      const newComment = await postService.addComment(selectedPost.id, text);
      setComments((prev) => [newComment, ...prev]);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === selectedPost.id) {
            return {
              ...post,
              comments: [newComment, ...(post.comments || [])],
              comments_count: post.comments_count + 1,
            };
          }
          return post;
        })
      );
    } catch (err) {
      showError('Failed to add comment');
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (error) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <Button onClick={loadData} icon={RefreshCw}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Feed</h1>
        </div>
      </div>

      <PostCreator
        profile={profile}
        onCreatePost={handleCreatePost}
        isLoading={postingLoading}
      />

      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No posts yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id, post.liked_by_user)}
              onComment={() => handleOpenComments(post)}
            />
          ))}
        </div>
      )}

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        comments={comments}
        onAddComment={handleAddComment}
        isLoading={commentsLoading}
      />
    </div>
  );
}
