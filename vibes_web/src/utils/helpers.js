import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function formatTimeAgo(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays > 7) {
      return format(date, 'MMM d, yyyy');
    }

    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatMessageTime(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function formatConversationTime(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    }

    if (isYesterday(date)) {
      return 'Yesterday';
    }

    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays < 7) {
      return format(date, 'EEE');
    }

    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

export function formatDateHeader(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    if (isToday(date)) {
      return 'Today';
    }

    if (isYesterday(date)) {
      return 'Yesterday';
    }

    return format(date, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

export function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
