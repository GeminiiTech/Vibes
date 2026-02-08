import { api } from './api';
import { authService } from './authService';

class ChatWebSocket {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.conversationId = null;
    this.listeners = [];
    this.isDisconnecting = false;
  }

  connect(conversationId) {
    this.conversationId = conversationId;
    this.isDisconnecting = false;
    this.reconnectAttempts = 0;

    return this._establishConnection();
  }

  _establishConnection() {
    return new Promise((resolve, reject) => {
      if (this.isDisconnecting) {
        reject(new Error('Disconnecting'));
        return;
      }

      const token = authService.getAccessToken();
      if (!token) {
        reject(new Error('Not authenticated'));
        return;
      }

      const wsUrl = `wss://vibes-lb2k.onrender.com/ws/chat/${this.conversationId}/?token=${token}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(data));
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onclose = () => {
        if (!this.isDisconnecting) {
          this._scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      };
    });
  }

  _scheduleReconnect() {
    if (this.isDisconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      this._establishConnection().catch(() => {});
    }, delay);
  }

  disconnect() {
    this.isDisconnecting = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close(1000);
      this.socket = null;
    }
    this.listeners = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  sendMessage(content) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'send_message',
        content: content.trim(),
      }));
    }
  }

  sendTypingIndicator(isTyping) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping,
      }));
    }
  }

  markRead() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'mark_read',
      }));
    }
  }
}

export const chatWebSocket = new ChatWebSocket();

export const chatService = {
  async getConversations() {
    return api.get('/chat/conversations/');
  },

  async createOrGetConversation(userId) {
    const response = await api.post('/chat/conversations/create/', { user_id: userId });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return response.json();
  },

  async getMessages(conversationId) {
    return api.get(`/chat/conversations/${conversationId}/messages/`);
  },

  async sendMessage(conversationId, content, image = null) {
    if (image) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', image);

      const response = await api.postFormData(
        `/chat/conversations/${conversationId}/messages/`,
        formData
      );
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    }

    const response = await api.post(`/chat/conversations/${conversationId}/messages/`, {
      content,
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  async markAsRead(conversationId) {
    const response = await api.post(`/chat/conversations/${conversationId}/read/`, {});
    return response.ok;
  },

  // WebSocket methods
  connectWebSocket(conversationId) {
    return chatWebSocket.connect(conversationId);
  },

  disconnectWebSocket() {
    chatWebSocket.disconnect();
  },

  addMessageListener(callback) {
    return chatWebSocket.addListener(callback);
  },

  sendMessageViaWS(content) {
    chatWebSocket.sendMessage(content);
  },

  sendTypingIndicator(isTyping) {
    chatWebSocket.sendTypingIndicator(isTyping);
  },

  markReadViaWS() {
    chatWebSocket.markRead();
  },
};
