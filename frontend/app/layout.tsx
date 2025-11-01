import type { Metadata } from "next";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Cipher Scribe Review",
  description: "Encrypted peer review dashboard powered by the FHEVM.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 antialiased">
        <Providers>
          <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <div className="pointer-events-none absolute inset-x-0 top-[-200px] mx-auto h-[480px] w-[720px] rounded-full bg-cyan-500/20 blur-[180px]" />
            <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/cipher-scribe-logo.svg"
                  alt="Cipher Scribe Logo"
                  width={44}
                  height={44}
                  priority
                />
                <div>
                  <p className="text-base font-semibold tracking-wide text-white">
                    Cipher Scribe
                  </p>
                  <p className="text-sm text-slate-300">
                    Encrypted Peer Review Control Room
                  </p>
                </div>
              </div>
              <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
              />
            </header>
            <main className="relative mx-auto w-full max-w-6xl px-6 pb-16">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
