import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Note: VAPID key would be needed for server-side FCM, but for client-side notifications we can skip
      const token = await getToken(messaging);
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  return null;
};

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
  new Notification(payload.notification?.title || 'Notification', {
    body: payload.notification?.body,
    icon: '/icon-192x192.png'
  });
});

export { messaging };