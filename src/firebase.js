import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCSavbBMpWHs4FzlSLHk3viJB0hICrAh6c',
  authDomain: 'abcd-fb39f.firebaseapp.com',
  projectId: 'abcd-fb39f',
  storageBucket: 'abcd-fb39f.firebasestorage.app',
  messagingSenderId: '345319161170',
  appId: '1:345319161170:web:b4065236bfad974d824e8b',
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
