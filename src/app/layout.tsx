import type { Metadata, Viewport } from "next";
import "./globals.css";

// Metadatos de la aplicacion.
export const metadata: Metadata = {
  title: "2048x2048 - Juego multijugador en tiempo real",
  description:
    "Juega al 2048 contra un rival en tiempo real. Crea una sala, comparte el codigo y compite por la puntuacion mas alta.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf7f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Fuentes cargadas desde Google Fonts en el navegador (el build no depende de red).
            Si no cargan, se usa el fallback del sistema. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
