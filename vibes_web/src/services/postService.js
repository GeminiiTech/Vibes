import { api } from './api';

export const postService = {
  async getPosts(userId = null) {
    const endpoint = userId
      ? `/api/posts/?user_id=${userId}`
      : '/api/posts/';
    return api.get(endpoint);
  },

  async createPost(content, image = null) {
    if (image) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', image);

      const response = await api.postFormData('/api/posts/', formData);
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      return response.json();
    }

    const response = await api.post('/api/posts/', { content });
    if (!response.ok) {
      throw new Error('Failed to create post');
    }
    return response.json();
  },

  async likePost(postId) {
    const response = await api.post(`/api/posts/${postId}/like/`, {});
    if (!response.ok) {
      throw new Error('Failed to like post');
    }
  },

  async unlikePost(postId) {
    const response = await api.post(`/api/posts/${postId}/unlike/`, {});
    if (!response.ok) {
      throw new Error('Failed to unlike post');
    }
  },

  async getComments(postId) {
    return api.get(`/api/posts/${postId}/comments/`);
  },

  async addComment(postId, text) {
    const response = await api.post(`/api/posts/${postId}/comments/`, { text });
    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    return response.json();
  },
};
