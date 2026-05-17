import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXgzrGvg8van-F99D8HNTKMYqE0gjgblw",
  authDomain: "my-fitness-hub-b12ce.firebaseapp.com",
  projectId: "my-fitness-hub-b12ce",
  storageBucket: "my-fitness-hub-b12ce.firebasestorage.app",
  messagingSenderId: "518738323828",
  appId: "1:518738323828:web:5983222c6d67259aa1e421"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Fixed user ID — this is your personal app, no login needed
export const UID = "parth-dental-fitness";
