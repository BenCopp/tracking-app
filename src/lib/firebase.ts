import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Test connection strictly according to guidelines
async function testConnection() {
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful');
  } catch (error) {
    console.warn("Firebase connection failed - app will work in offline mode:", error);
    // Don't throw - let the app continue in offline mode
  }
}
testConnection();
