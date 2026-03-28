import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAJaYE0clRn_ntgDe_6hhrPJQyp_9ydAW0",
  authDomain: "vitalguard-77.firebaseapp.com",
  projectId: "vitalguard-77",
  storageBucket: "vitalguard-77.firebasestorage.app",
  messagingSenderId: "789974329748",
  appId: "1:789974329748:web:4fdf29fe813c3a7735c781",
  databaseURL: "https://vitalguard-77-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
