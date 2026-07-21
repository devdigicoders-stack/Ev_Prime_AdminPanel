import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCmIYlFSA3Djg4U60zVNycuSwvs4p_5FIg",
  authDomain: "crmadmin-d988f.firebaseapp.com",
  projectId: "crmadmin-d988f",
  storageBucket: "crmadmin-d988f.firebasestorage.app",
  messagingSenderId: "380846726921",
  appId: "1:380846726921:web:f20292a47aa698cfaebdd8",
  measurementId: "G-TEQS700K5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Note: without vapidKey, it might still work if configured properly in Firebase,
      // but usually VAPID key is needed. We will just request token.
      const token = await getToken(messaging);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
};

export const setupOnMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { messaging };
