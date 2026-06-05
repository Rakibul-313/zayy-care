import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyChjYsxccPSa94QolWSqtniWaVXBRnx-RU",
  authDomain: "zayy-care.firebaseapp.com",
  projectId: "zayy-care",
  storageBucket: "zayy-care.firebasestorage.app",
  messagingSenderId: "63751894843",
  appId: "1:63751894843:web:67046d58005ef5256a291e",
  measurementId: "G-H1RK4ZP8P0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);

export default app;