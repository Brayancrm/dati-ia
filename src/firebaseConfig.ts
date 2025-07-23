// Configuração do Firebase para o projeto DATI.IA
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC-5LWsZ66cEX2hJDiJeZ8S-RolXcqEYOQ",
  authDomain: "dati-ia.firebaseapp.com",
  projectId: "dati-ia",
  storageBucket: "dati-ia.appspot.com",
  messagingSenderId: "585733369804",
  appId: "1:585733369804:web:92bd29a3072fde84f9b769",
  measurementId: "G-Q72BEJFH62"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 