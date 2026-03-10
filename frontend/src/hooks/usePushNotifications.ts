import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export const usePushNotifications = () => {
  const { accessToken } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check if push notifications are supported
  const isSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 PUSH NOTIFICATION SUBSCRIPTION STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!accessToken) {
      console.warn('❌ No access token available');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return false;
    }

    try {
      console.log('📋 Step 1: Requesting notification permission...');
      // First request permission
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        console.warn('❌ Notification permission not granted');
        console.log('   Current permission state:', Notification.permission);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return false;
      }
      console.log('✅ Permission granted');

      console.log('\n🔍 Step 2: Checking for existing subscription...');
      // Check if service worker already exists and has a subscription
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      console.log(`   Found ${existingRegistrations.length} existing registration(s)`);
      
      let registration;
      
      if (existingRegistrations.length > 0) {
        const existingReg = existingRegistrations[0];
        const existingSub = await existingReg.pushManager.getSubscription();
        if (existingSub) {
          console.log('   Found existing subscription, re-registering with backend...');
          try {
            // Always re-save to backend so server always has valid subscription
            // (covers deploys, DB resets, etc. — Chrome FCM subscriptions persist
            // in the browser but the server record can be lost)
            await api.post(
              '/notifications/push/subscribe',
              {
                endpoint: existingSub.endpoint,
                keys: {
                  p256dh: arrayBufferToBase64(existingSub.getKey('p256dh')!),
                  auth: arrayBufferToBase64(existingSub.getKey('auth')!),
                },
                deviceInfo: {
                  userAgent: navigator.userAgent,
                  browser: getBrowserName(),
                  os: getOSName(),
                },
              }
            );
            console.log('\u2705 Existing subscription re-saved to backend');
            console.log('   Endpoint:', existingSub.endpoint.substring(0, 60) + '...');
            setSubscription(existingSub);
            console.log('\n\uD83C\uDF89 SUBSCRIPTION CONFIRMED');
            console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');
            return true;
          } catch (err) {
            console.log('   Error re-saving subscription, will recreate:', err.message);
            await existingSub.unsubscribe();
          }
        } else {
          console.log('   Existing registration found but no subscription');
        }
        
        // Unregister for clean slate before creating fresh subscription
        console.log('   Unregistering existing service worker for clean slate...');
        await existingReg.unregister();
        console.log('   ✅ Service worker unregistered');
        registration = null;
      }

      // Register a fresh service worker
      console.log('\n📝 Step 3: Registering service worker...');
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service worker registered');
      console.log('   Scope:', registration.scope);
      console.log('   Active:', !!registration.active);
      
      console.log('\n⏳ Step 4: Waiting for service worker to be ready...');
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');
      
      // Wait a bit more for service worker to fully activate
      console.log('   Waiting 2 seconds for full activation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('   ✅ Additional wait complete');

      console.log('\n🔑 Step 5: Fetching VAPID public key from server...');
      // Get VAPID public key from server
      const { data } = await api.get('/notifications/push/vapid-public-key');
      const publicKey = data.publicKey;

      if (!publicKey) {
        throw new Error('VAPID public key not available from server');
      }
      console.log('✅ VAPID key received');
      console.log('   Key length:', publicKey.length);
      console.log('   Key (first 50 chars):', publicKey.substring(0, 50) + '...');
      console.log('   Key (last 50 chars):', '...' + publicKey.substring(publicKey.length - 50));

      console.log('\n🔔 Step 6: Subscribing to push manager...');
      console.log('   Converting VAPID key to Uint8Array...');
      let applicationServerKey;
      try {
        applicationServerKey = urlBase64ToUint8Array(publicKey);
        console.log('   ✅ Key converted, length:', applicationServerKey.length);
      } catch (conversionError) {
        console.error('   ❌ Key conversion failed:', conversionError);
        throw new Error('Failed to convert VAPID key: ' + conversionError.message);
      }

      console.log('   Checking push manager state...');
      const existingPushSub = await registration.pushManager.getSubscription();
      if (existingPushSub) {
        console.log('   ⚠️ Found existing push subscription, unsubscribing first...');
        await existingPushSub.unsubscribe();
        console.log('   ✅ Unsubscribed from existing push');
      } else {
        console.log('   ✅ No existing push subscription');
      }

      console.log('   Calling pushManager.subscribe()...');
      console.log('   Options: { userVisibleOnly: true, applicationServerKey: Uint8Array(' + applicationServerKey.length + ') }');
      console.log('   Current origin:', window.location.origin);
      console.log('   Is localhost:', window.location.hostname === 'localhost');
      
      // CRITICAL NOTE: FCM often fails on localhost. This is a known Chrome limitation.
      // For production, use HTTPS domain. For development, consider using Firefox or ngrok.
      if (window.location.hostname === 'localhost') {
        console.log('   ⚠️  WARNING: Running on localhost - FCM may fail due to Chrome limitations');
        console.log('   Solutions:');
        console.log('     1. Try Firefox instead of Chrome');
        console.log('     2. Use ngrok for HTTPS tunnel');
        console.log('     3. Deploy to production domain');
      }
      
      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log('✅ Push subscription successful');
      console.log('   Endpoint:', pushSubscription.endpoint.substring(0, 50) + '...');

      console.log('\n📤 Step 7: Sending subscription to server...');
      // Send subscription to server
      await api.post(
        '/notifications/push/subscribe',
        {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            browser: getBrowserName(),
            os: getOSName(),
          },
        }
      );

      console.log('✅ Subscription saved to server');
      console.log('   Browser:', getBrowserName());
      console.log('   OS:', getOSName());
      
      setSubscription(pushSubscription);
      
      console.log('\n🎉 PUSH NOTIFICATION SUBSCRIPTION COMPLETE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return true;

    } catch (error) {
      console.error('\n❌ ERROR SUBSCRIBING TO PUSH:', error);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return false;
    }
  };

  // Unsubscribe
  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await api.post(
        '/notifications/push/unsubscribe',
        { endpoint: subscription.endpoint }
      );

      await subscription.unsubscribe();
      setSubscription(null);

    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  // Check current subscription
  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    });

    setPermission(Notification.permission);
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}
