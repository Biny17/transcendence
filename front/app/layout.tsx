import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./home/Background.css";
import "./online/online-background.css";
import "./rules/comicspeechbubbles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const baloo2 = Baloo_2({
  variable: "--font-party-title",
  subsets: ["latin"],
  preload: false,
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Fun Guy",
  description: "nice game",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fun Guys",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/champion.png",
    apple: "/champion.png",
  },
  applicationName: "Fun Guys",
  keywords: ["game", "multiplayer", "interactive"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "Fun Guy",
    description: "nice game",
    images: [
      {
        url: "/champion.png",
        width: 192,
        height: 192,
        alt: "Fun Guy App Icon",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason instanceof TypeError && e.reason.message && e.reason.message.includes('NetworkError')) {
                  e.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${baloo2.variable} antialiased`}
        style={{ background: "#060816", margin: 0, padding: 0 }}
      >
        <div
          className="background"
          style={{ position: "fixed", inset: 0, zIndex: 0 }}
        >
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
