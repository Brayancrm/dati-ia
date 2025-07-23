"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import ImportProgressBar from "./ImportProgressBar";

export default function ImportProgressWrapper() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Não mostrar se estiver carregando ou se não há usuário logado
  if (loading || !user) {
    return null;
  }

  return <ImportProgressBar userEmail={user.email} />;
} 