// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyCmIYlFSA3Djg4U60zVNycuSwvs4p_5FIg",
  authDomain: "crmadmin-d988f.firebaseapp.com",
  projectId: "crmadmin-d988f",
  storageBucket: "crmadmin-d988f.firebasestorage.app",
  messagingSenderId: "380846726921",
  appId: "1:380846726921:web:f20292a47aa698cfaebdd8",
  measurementId: "G-TEQS700K5X"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'EV Prime Admin';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
