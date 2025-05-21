import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCLue-PcwDYtyIHQAzKl9Z6RLTrBgZ1rUY",
    authDomain: "fir-502e5.firebaseapp.com",
    databaseURL: "https://fir-502e5-default-rtdb.firebaseio.com",
    projectId: "fir-502e5",
    storageBucket: "fir-502e5.firebasestorage.app",
    messagingSenderId: "243730473450",
    appId: "1:243730473450:web:281358f2a30d2d44bfd293",
    measurementId: "G-25G10VVBQ9"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

export { auth, db };
