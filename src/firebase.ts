import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMhYc0msL_7oJKWR0mVuwNVXRIGq1VD6k",
  authDomain: "cognify-babb2.firebaseapp.com",
  projectId: "cognify-babb2",
  storageBucket: "cognify-babb2.firebasestorage.app",
  messagingSenderId: "795396723397",
  appId: "1:795396723397:web:504c08cb46431ad01616ac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
