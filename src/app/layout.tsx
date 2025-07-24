"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserMenu from "@/components/UserMenu";
import ImportProgressWrapper from "@/components/ImportProgressWrapper";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Funções para lidar com os cliques dos botões quando estiver na landing page
  const handleLoginClick = () => {
    if (pathname === '/') {
      // Se estiver na landing page, use a função do próprio componente da página
      const event = new CustomEvent('openLoginModal');
      window.dispatchEvent(event);
    } else {
      router.push('/');
    }
  };

  const handleCreateAccountClick = () => {
    if (pathname === '/') {
      // Se estiver na landing page, use a função do próprio componente da página
      const event = new CustomEvent('openCreateAccountModal');
      window.dispatchEvent(event);
    } else {
      router.push('/');
    }
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Meta tag para viewport responsivo */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
        style={{ background: '#f8fafc' }}
      >
        <header className="w-full h-[72px] flex items-center justify-between px-4 sm:px-8 bg-green-900 shadow-lg fixed top-0 left-0 z-50 border-b-4 border-yellow-400">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow flex items-center gap-2">
            DATI.IA
            <span className="ml-2 w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/bases" className="text-gray-600 hover:text-gray-900 transition-colors">
              Bases
            </Link>
            <Link href="/prospeccao" className="text-gray-600 hover:text-gray-900 transition-colors">
              Prospecção
            </Link>
            <Link href="/relatorios" className="text-gray-600 hover:text-gray-900 transition-colors">
              Relatórios
            </Link>
            <Link href="/recarga" className="text-gray-600 hover:text-gray-900 transition-colors">
              Recarga
            </Link>
            {user?.email === 'Brayan@agilivertex.com.br' && (
              <>
                <Link href="/usuarios" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Usuários
                </Link>
                <Link href="/notificacoes" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Notificações
                </Link>
                <Link href="/auditoria" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Auditoria
                </Link>
              </>
            )}
            <Link href="/meus-dados" className="text-gray-600 hover:text-gray-900 transition-colors">
              Meus Dados
            </Link>
          </div>
          <UserMenu 
            onLoginClick={handleLoginClick}
            onCreateAccountClick={handleCreateAccountClick}
          />
        </header>
        <main className="w-full flex justify-center min-h-screen pt-[72px] mobile-container">
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>
        <ImportProgressWrapper />
      </body>
    </html>
  );
}
