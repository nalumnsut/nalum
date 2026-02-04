import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  sender?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string, deleteAllFromSameSender?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { page: 1, limit: 20 },
      });

      // Transform _id to id for consistency with socket notifications
      const transformedNotifications = response.data.data.notifications.map((n: any) => ({
        ...n,
        id: n._id || n.id,
      }));

      setNotifications(transformedNotifications);
      
      // Also fetch unread count
      const countResponse = await api.get('/notifications/unread-count');
      setUnreadCount(countResponse.data.count);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    if (!accessToken) return;

    try {
      await api.patch(
        `/notifications/${notificationId}/read`
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!accessToken) return;

    try {
      await api.patch(
        '/notifications/mark-all-read'
      );

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification (with support for bulk deletion of message notifications)
  const deleteNotification = async (notificationId: string, deleteAllFromSameSender = false) => {
    if (!accessToken) return;

    try {
      // Find the notification being deleted
      const notification = notifications.find(n => n.id === notificationId);
      
      // If notification doesn't exist locally, it's already been removed
      if (!notification) {
        console.log('Notification already removed from local state:', notificationId);
        return;
      }
      
      // If it's a message notification and we want to delete all from same sender
      if (deleteAllFromSameSender && notification?.type === 'new_message' && notification.sender?._id) {
        const senderId = notification.sender._id;
        
        // Get all message notification IDs from this sender
        const notificationIdsToDelete = notifications
          .filter(n => n.type === 'new_message' && n.sender?._id === senderId)
          .map(n => n.id);

        // Delete all of them from backend (silently ignore 404s)
        await Promise.allSettled(
          notificationIdsToDelete.map(id => 
            api.delete(`/notifications/${id}`).catch(err => {
              if (err.response?.status === 404) {
                console.log(`Notification ${id} already deleted on server`);
                return null;
              }
              throw err;
            })
          )
        );

        // Update local state - remove all message notifications from this sender
        setNotifications(prev => prev.filter(n => 
          !(n.type === 'new_message' && n.sender?._id === senderId)
        ));
      } else {
        // Single notification deletion
        try {
          await api.delete(`/notifications/${notificationId}`);
        } catch (err: any) {
          // Ignore 404 - notification already deleted
          if (err.response?.status === 404) {
            console.log(`Notification ${notificationId} already deleted on server`);
          } else {
            throw err;
          }
        }

        // Update local state regardless (optimistic delete)
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }

    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (!socket || !isConnected) return;

    // New notification received
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => {
        // Check if this notification ID already exists (backend updated existing one)
        const existingIndex = prev.findIndex(n => n.id === notification.id);
        
        if (existingIndex !== -1) {
          // This is an update to existing notification - replace it and move to top
          const newList = [...prev];
          newList.splice(existingIndex, 1); // Remove old version
          return [notification, ...newList]; // Add updated version at top
        }
        
        // For new message notifications, also check by conversation
        if (notification.type === 'new_message' && (notification as any).metadata?.conversationId) {
          const conversationId = (notification as any).metadata.conversationId;
          
          // Find existing notification from same conversation (different ID)
          const convIndex = prev.findIndex(n => 
            n.type === 'new_message' && 
            (n as any).metadata?.conversationId === conversationId &&
            !n.read // Only replace unread ones
          );

          if (convIndex !== -1) {
            // Replace existing conversation notification with new one
            const newList = [...prev];
            const oldNotif = newList[convIndex];
            newList.splice(convIndex, 1); // Remove old one
            
            // If old one was unread, don't increment count (it's a replacement)
            if (!oldNotif.read && !notification.read) {
              // Don't change unread count - just replacing
              return [notification, ...newList];
            }
          }
        }
        
        // Completely new notification - add to top and increment count
        return [notification, ...prev];
      });
      
      // Only increment unread count for truly NEW notifications
      // (not updates/replacements - those are handled above)
      setUnreadCount(prev => {
        const existing = notifications.find(n => n.id === notification.id);
        if (existing) {
          // This is an update, not a new notification
          return prev;
        }
        // Check if we're replacing a conversation notification
        if (notification.type === 'new_message' && (notification as any).metadata?.conversationId) {
          const conversationId = (notification as any).metadata.conversationId;
          const hasExisting = notifications.some(n => 
            n.type === 'new_message' && 
            (n as any).metadata?.conversationId === conversationId &&
            !n.read
          );
          if (hasExisting) {
            // Replacing existing, don't increment
            return prev;
          }
        }
        // Truly new notification
        return notification.read ? prev : prev + 1;
      });
    });

    // Badge count update
    socket.on('notification:badge', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    // Notification removed (e.g., when message is unsent)
    socket.on('notification:removed', ({ notificationId }: { notificationId: string }) => {
      setNotifications(prev => {
        const notifToRemove = prev.find(n => n.id === notificationId);
        // Only decrease count if the removed notification was unread
        if (notifToRemove && !notifToRemove.read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    });

    return () => {
      socket.off('notification');
      socket.off('notification:badge');
      socket.off('notification:removed');
    };
  }, [socket, isConnected]);

  // Initial fetch
  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
