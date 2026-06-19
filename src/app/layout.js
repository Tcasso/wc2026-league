// Replace your existing src/app/layout.js with this.
// PWA manifest + dark fullscreen status bar (no white strip at top).

export const metadata = {
  title: "World Cup 2026 League",
  description: "Private World Cup 2026 prediction league",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WC2026",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#06140c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: "#06140c" }}>
      <body style={{ background: "#06140c", margin: 0 }}>{children}</body>
    </html>
  );
}
