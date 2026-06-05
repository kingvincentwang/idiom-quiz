import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwooMJ0vsEkQTFJ7HDRg8i4ex0nEPa2Tk",
  authDomain: "web-login-dd626.firebaseapp.com",
  projectId: "web-login-dd626",
  storageBucket: "web-login-dd626.firebasestorage.app",
  messagingSenderId: "128529685419",
  appId: "1:128529685419:web:7dc95d7fd209bd877a90ee",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);