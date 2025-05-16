// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW0H1lEMNx0iVHGRs1bynst0xce6-aJCo",
  authDomain: "mywaterapp-90cde.firebaseapp.com",
  databaseURL: "https://mywaterapp-90cde-default-rtdb.firebaseio.com",
  projectId: "mywaterapp-90cde",
  storageBucket: "mywaterapp-90cde.appspot.com",
  messagingSenderId: "779713470345",
  appId: "1:779713470345:web:296ee4124e587ed564cb58",
  measurementId: "G-65V80PQ16T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services (API modulaire)
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
