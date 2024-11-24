// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA94gvq-hzOT8AeLUnMjY69-THkP_bt5p0",
  authDomain: "knowledge-days-with-warikoo.firebaseapp.com",
  projectId: "knowledge-days-with-warikoo",
  storageBucket: "knowledge-days-with-warikoo.firebasestorage.app",
  messagingSenderId: "220721257942",
  appId: "1:220721257942:web:0f83cfa9e5cb0b2e561877"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
