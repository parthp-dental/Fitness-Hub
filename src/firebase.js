import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXgzrGv8van-F99D8HNTKMYqE0gjgblw",
  authDomain: "my-fitness-hub-b12ce.firebaseapp.com",
  projectId: "my-fitness-hub-b12ce",
  storageBucket: "my-fitness-hub-b12ce.firebasestorage.app",
  messagingSenderId: "518738323828",
  appId: "1:518738323828:web:5983222c6d67259aa1e421"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
