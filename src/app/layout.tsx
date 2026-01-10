import type { Metadata } from "next";
import { Inter, Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cse23-elections.vercel.app"),
  title: "CSE 23 Department Representative Elections",
  description: "Secure voting platform for CSE 23 batch representative elections",
  icons: {
    icon: "/cse23logo.jpg",
    apple: "/cse23logo.jpg",
  },
  openGraph: {
    title: "CSE 23 Department Representative Elections",
    description: "Secure voting platform for CSE 23 batch representative elections",
    images: ["/cse23logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} font-sans antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
