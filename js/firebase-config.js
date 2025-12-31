

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';


const firebaseConfig = {
  apiKey: "AIzaSyCWcwaksAE4aWL0fecRaB7_bMV9sp31_ms",
  authDomain: "we2gth.firebaseapp.com",
  databaseURL: "https://we2gth-default-rtdb.firebaseio.com",
  projectId: "we2gth",
  storageBucket: "we2gth.firebasestorage.app",
  messagingSenderId: "421039329174",
  appId: "1:421039329174:web:6f75b5ac622717334097b7",
  measurementId: "G-DM14L8WKTX"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);


export const ADMIN_CODE = "owner+admin#Bot";




export let isAdmin = false;