// Script para criar usuários iniciais no Firebase Auth
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { app } from "@/firebaseConfig";

const auth = getAuth(app);

async function seedUsers() {
  try {
    // Usuário master
    await createUserWithEmailAndPassword(auth, "Brayan@agilisvertex.com.br", "110106");
    await updateProfile(auth.currentUser!, { displayName: "BRAYAN ANDRADE" });
    // Usuário comum
    await createUserWithEmailAndPassword(auth, "Teste@teste.com.br", "123456");
    await updateProfile(auth.currentUser!, { displayName: "USUÁRIO TESTE" });
    console.log("Usuários criados com sucesso!");
  } catch (err) {
    console.error("Erro ao criar usuários:", err);
  }
}

seedUsers(); 