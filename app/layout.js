import "./globals.css";

export const metadata = {
  title: "NEWS INFO9 – తాజా తెలుగు షార్ట్ న్యూస్",
  description: "NEWS INFO9 – మీ ఊరు, జిల్లా, రాష్ట్ర తాజా వార్తలు 60 పదాల్లో. Short local news in Telugu & English.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png", apple: "/icon-192.png" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://newsinfo9.vercel.app"),
  applicationName: "NEWS INFO9",
  authors: [{ name: "Exclusive News India Private Limited" }],
  openGraph: { title: "NEWS INFO9", description: "తాజా తెలుగు షార్ట్ న్యూస్ – Local news in 60 words", images: ["/icon-512.png"] }
};

export const viewport = { themeColor: "#0a6cc4", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="te">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
