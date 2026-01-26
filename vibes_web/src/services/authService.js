import { api } from './api';

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    const user = decodeJwt(data.access);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  async register(fullname, username, email, password, profileImage) {
    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (profileImage) {
      // Create a new File object to ensure proper MIME type
      const file = new File(
        [profileImage],
        profileImage.name,
        { type: profileImage.type || 'image/jpeg' }
      );
      formData.append('profile_picture', file);
    }

    const response = await api.postFormData('/auth/register/', formData);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    const user = decodeJwt(data.access);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    // If token is expired, try to refresh
    if (isTokenExpired(token)) {
      const refresh = localStorage.getItem('refresh_token');
      return !!refresh; // Let the app try to refresh
    }
    return true;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCurrentUserId() {
    const user = this.getCurrentUser();
    return user?.user_id || null;
  },

  getAccessToken() {
    return localStorage.getItem('access_token');
  },

  async getUserProfile() {
    const user = this.getCurrentUser();
    if (!user?.user_id) throw new Error('Not authenticated');

    return api.get(`/auth/profile/${user.user_id}/`);
  },

  async getProfileById(userId) {
    return api.get(`/auth/profile/${userId}/`);
  },

  async followUser(userId) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('Not authenticated');

    const response = await api.post('/auth/follow/', {
      follower_id: currentUserId,
      followed_id: userId,
    });

    if (!response.ok) {
      throw new Error('Failed to follow user');
    }
  },

  async unfollowUser(userId) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('Not authenticated');

    const response = await api.post('/auth/unfollow/', {
      follower_id: currentUserId,
      followed_id: userId,
    });

    if (!response.ok) {
      throw new Error('Failed to unfollow user');
    }
  },

  async getFollowers(userId) {
    return api.get(`/auth/followers/?user_id=${userId}`);
  },

  async getFollowing(userId) {
    return api.get(`/auth/following/?user_id=${userId}`);
  },

  async updateProfile(fullname, profileImage) {
    const formData = new FormData();

    if (fullname) {
      formData.append('fullname', fullname);
    }

    if (profileImage) {
      const file = new File(
        [profileImage],
        profileImage.name,
        { type: profileImage.type || 'image/jpeg' }
      );
      formData.append('profile_picture', file);
    }

    const response = await api.putFormData('/auth/profile/', formData);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Failed to update profile');
    }

    return response.json();
  },
};
