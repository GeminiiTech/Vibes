import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Edit, Camera } from 'lucide-react';
import { authService } from '../services/authService';
import { postService } from '../services/postService';
import { chatService } from '../services/chatService';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { PostCard } from '../components/post/PostCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BottomSheet } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export function Profile() {
  const { showError, showInfo } = useToast();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userListOpen, setUserListOpen] = useState(false);
  const [userListTitle, setUserListTitle] = useState('');
  const [userListData, setUserListData] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);

  // Edit profile state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullname, setEditFullname] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const editFileRef = useRef(null);

  const currentUserId = authService.getCurrentUserId();
  const isOwnProfile = Number(currentUserId) === Number(userId);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, postsData] = await Promise.all([
        authService.getProfileById(userId),
        postService.getPosts(userId),
      ]);

      setProfile(profileData);
      setPosts(postsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFollow = async () => {
    if (!profile) return;

    setFollowLoading(true);
    try {
      if (profile.is_followed_by_me) {
        await authService.unfollowUser(userId);
      } else {
        await authService.followUser(userId);
      }

      const updatedProfile = await authService.getProfileById(userId);
      setProfile(updatedProfile);
    } catch (err) {
      showError('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = async () => {
    try {
      const conversation = await chatService.createOrGetConversation(parseInt(userId));
      navigate(`/messages/${conversation.id}`, {
        state: { otherUser: conversation.other_participant || profile },
      });
    } catch (err) {
      showError('Failed to open chat');
    }
  };

  const handleShowFollowers = async () => {
    setUserListTitle('Followers');
    setUserListOpen(true);
    setUserListLoading(true);

    try {
      const data = await authService.getFollowers(userId);
      setUserListData(data);
    } catch (err) {
      showError('Failed to load followers');
    } finally {
      setUserListLoading(false);
    }
  };

  const handleShowFollowing = async () => {
    setUserListTitle('Following');
    setUserListOpen(true);
    setUserListLoading(true);

    try {
      const data = await authService.getFollowing(userId);
      setUserListData(data);
    } catch (err) {
      showError('Failed to load following');
    } finally {
      setUserListLoading(false);
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
    }
  };

  const handleOpenEditModal = () => {
    setEditFullname(profile?.fullname || '');
    setEditImage(null);
    setEditPreview(profile?.profile_picture || null);
    setEditModalOpen(true);
  };

  const handleEditImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullname.trim()) {
      showError('Please enter your name');
      return;
    }

    setEditLoading(true);
    try {
      const updatedProfile = await authService.updateProfile(
        editFullname.trim(),
        editImage
      );
      setProfile(updatedProfile);
      setEditModalOpen(false);
      showInfo('Profile updated successfully');
    } catch (err) {
      showError('Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Profile Header */}
      <div className="card p-8 mb-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar with gradient ring */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur opacity-30"></div>
            <Avatar
              src={profile?.profile_picture}
              name={profile?.username}
              size="xl"
              className="relative"
            />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-800 dark:text-slate-100">
            {profile?.fullname}
          </h1>
          <p className="text-primary-600 dark:text-primary-400 font-medium">@{profile?.username}</p>

          {/* Stats */}
          <div className="flex gap-2 mt-6 w-full max-w-xs">
            <div className="flex-1 text-center py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{posts.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Posts</p>
            </div>
            <button
              onClick={handleShowFollowers}
              className="flex-1 text-center py-3 px-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {profile?.followers_count || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Followers</p>
            </button>
            <button
              onClick={handleShowFollowing}
              className="flex-1 text-center py-3 px-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {profile?.following_count || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Following</p>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {isOwnProfile ? (
              <Button variant="outline" icon={Edit} onClick={handleOpenEditModal}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant={profile?.is_followed_by_me ? 'secondary' : 'primary'}
                  onClick={handleToggleFollow}
                  loading={followLoading}
                  className="min-w-[120px]"
                >
                  {profile?.is_followed_by_me ? 'Unfollow' : 'Follow'}
                </Button>
                <Button variant="outline" icon={MessageCircle} onClick={handleOpenChat}>
                  Message
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Edit className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No posts yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Posts will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id, post.liked_by_user)}
              onComment={() => {}}
            />
          ))}
        </div>
      )}

      {/* User List Modal */}
      <BottomSheet
        isOpen={userListOpen}
        onClose={() => setUserListOpen(false)}
        title={userListTitle}
      >
        <div className="p-4">
          {userListLoading ? (
            <LoadingSpinner className="py-8" />
          ) : userListData.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-400">No {userListTitle.toLowerCase()} yet</p>
          ) : (
            <div className="space-y-2">
              {userListData.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setUserListOpen(false);
                    if (user.id !== parseInt(userId)) {
                      navigate(`/profile/${user.id}`);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <Avatar
                    src={user.profile_picture}
                    name={user.username}
                    size="sm"
                  />
                  <div className="text-left">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{user.fullname}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Edit Profile Modal */}
      <BottomSheet
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
      >
        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <input
              ref={editFileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleEditImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => editFileRef.current?.click()}
              className="relative group"
            >
              {editPreview ? (
                <img
                  src={editPreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-700 group-hover:ring-primary-100 dark:group-hover:ring-primary-900 transition-all"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tap to change photo</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editFullname}
              onChange={(e) => setEditFullname(e.target.value)}
              placeholder="Enter your full name"
              className="input"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={profile?.username || ''}
              disabled
              className="input opacity-60"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Username cannot be changed</p>
          </div>

          {/* Save Button */}
          <Button
            className="w-full"
            onClick={handleSaveProfile}
            loading={editLoading}
          >
            Save Changes
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
