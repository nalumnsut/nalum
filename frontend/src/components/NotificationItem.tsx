import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
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
    metadata?: Record<string, any>;
  };
  onClose: () => void;
}

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const conversationId = notification.metadata?.conversationId;
    const messageId = notification.metadata?.messageId;
    const isChatNotification = ['new_message', 'connection_request', 'connection_accepted'].includes(notification.type);
    const destination = isChatNotification && conversationId
      ? `/dashboard/chat/${conversationId}${messageId ? `?messageId=${messageId}` : ''}`
      : notification.actionUrl;

    if (destination) {
      navigate(destination);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // For message notifications, delete all from the same sender
    const deleteAllFromSender = notification.type === 'new_message';
    await deleteNotification(notification.id, deleteAllFromSender);
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-white/5 transition-colors cursor-pointer relative group",
        !notification.read && "bg-blue-500/10"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {notification.sender && (
          <UserAvatar
            name={notification.sender.name}
            src={notification.sender.profilePicture}
            size="sm"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-1 text-white">
            {notification.title}
          </p>
          <p className="text-sm text-gray-400 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator & Delete */}
        <div className="flex flex-col items-end gap-2">
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
            onClick={handleDelete}
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};
