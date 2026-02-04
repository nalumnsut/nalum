import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/NotificationItem";
import { useNotifications } from "@/context/NotificationContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const MobileNotifications = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAllAsRead 
  } = useNotifications();
  
  const { isSupported, permission, subscribe } = usePushNotifications();
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    // Debug logging
    console.log('Push Notifications Status:', {
      supported: isSupported(),
      permission: permission,
      shouldShowPrompt: isSupported() && permission === 'default'
    });

    // Show push notification prompt if supported but not enabled
    if (isSupported() && permission === 'default') {
      setShowPushPrompt(true);
    } else {
      setShowPushPrompt(false);
    }
  }, [permission, isSupported]);

  // Separate effect to handle auto-subscription (runs only once when permission granted)
  useEffect(() => {
    let hasRun = false;
    
    // CRITICAL: If permission is granted but subscription might not be complete,
    // trigger subscription automatically (but only once)
    if (isSupported() && permission === 'granted' && !hasRun) {
      hasRun = true;
      console.log('🔄 Permission granted detected, ensuring subscription is active...');
      // Call subscribe to ensure the subscription is registered
      // (it will skip if already subscribed)
      subscribe().then(success => {
        if (success) {
          console.log('✅ Subscription confirmed/created');
        } else {
          console.log('⚠️ Subscription check failed');
          // Check if it's a localhost issue
          if (window.location.hostname === 'localhost') {
            toast.error('Push notifications may not work on localhost. Try Firefox or use HTTPS domain.');
          }
        }
      }).catch(err => {
        console.error('❌ Subscription error:', err);
        if (window.location.hostname === 'localhost') {
          toast.error('Chrome blocks push on localhost. Try Firefox or deploy to HTTPS domain.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  const handleEnablePush = async () => {
    console.log('Attempting to enable push notifications...');
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled!');
      setShowPushPrompt(false);
    } else {
      toast.error('Failed to enable push notifications. Check browser console for details.');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-gray-300" />
            <h1 className="text-xl font-semibold text-white">Notifications</h1>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Content - Below header */}
      <div className="flex-1 overflow-hidden mt-16">
        {/* Push Notification Status Banner (for debugging) */}
        {!isSupported() && (
          <div className="mx-4 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white mb-1">
                  Push Notifications Not Supported
                </h3>
                <p className="text-xs text-gray-300">
                  Your browser doesn't support push notifications. Try using Chrome, Firefox, or Edge on desktop/Android.
                </p>
              </div>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white mb-1">
                  Push Notifications Blocked
                </h3>
                <p className="text-xs text-gray-300 mb-2">
                  You've blocked push notifications for this site. To enable them:
                </p>
                <ol className="text-xs text-gray-300 list-decimal list-inside space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {permission === 'granted' && (
          <div className="mx-4 mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCheck className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white mb-1">
                  Push Notifications Enabled
                </h3>
                <p className="text-xs text-gray-300">
                  You'll receive push notifications even when the app is closed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Push Notification Prompt */}
        {showPushPrompt && (
          <div className="mx-4 mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white mb-1">
                  Enable Push Notifications
                </h3>
                <p className="text-xs text-gray-300 mb-3">
                  Stay updated with real-time notifications even when you're not using the app.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEnablePush}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                  >
                    Enable
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPushPrompt(false)}
                    className="text-gray-400 hover:text-white hover:bg-white/10 text-xs h-8"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : notifications.filter(n => !n.read).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
              <Inbox className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-300">No notifications</p>
              <p className="text-sm text-gray-500 text-center mt-2">
                You're all caught up! You'll see notifications here when you receive connection requests, messages, or updates.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.filter(n => !n.read).map((notification) => (
                <div key={notification.id} className="px-4">
                  <NotificationItem notification={notification} onClose={() => {}} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default MobileNotifications;
