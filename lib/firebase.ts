import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore,
} from "firebase/firestore";

// Ces valeurs ne sont pas secrètes : la sécurité est assurée par les règles Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyDMQjBUz8tti7TEOk8T2_1HorNKKrvzG7o",
  authDomain: "mes-finances-fbf7c.firebaseapp.com",
  projectId: "mes-finances-fbf7c",
  storageBucket: "mes-finances-fbf7c.firebasestorage.app",
  messagingSenderId: "430880289692",
  appId: "1:430880289692:web:fa6fa868b2a071fbb74e59",
};

let app: FirebaseApp, auth: Auth, db: Firestore;

/** Initialisation paresseuse : uniquement côté navigateur. */
export function fb() {
  if (!app) {
    app = getApps()[0] || initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.languageCode = "fr";                 // e-mails de vérification et de réinitialisation en français
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
  }
  return { app, auth, db };
}
