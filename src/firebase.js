import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBj8km1jFRJEFa-ZT772lLvDZxF6YtBKkg',
  authDomain: 'medicore-clinic-65b17.firebaseapp.com',
  projectId: 'medicore-clinic-65b17',
  storageBucket: 'medicore-clinic-65b17.firebasestorage.app',
  messagingSenderId: '692984813828',
  appId: '1:692984813828:web:76a316a219077247769851',
  measurementId: 'G-VTBCJ5C0DP',
};

export const isFirebaseConfigured = true;

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
}

export { auth, googleProvider };
export default app;
