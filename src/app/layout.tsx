import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { StorageGate } from "@/components/StorageGate";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const DESCRIPTION =
  "Exam seating arrangements, without neighbours sharing a subject.";

export const metadata: Metadata = {
  // Lets links to icons and previews resolve to the real address.
  metadataBase: new URL("https://seduta.ebinthomas.dev"),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: DESCRIPTION,
  // What shows when the link is shared in a chat or social post.
  openGraph: {
    type: "website",
    url: "/",
    siteName: APP_NAME,
    title: `${APP_NAME}: exam seating plans`,
    description: DESCRIPTION,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Light by default; ThemeProvider updates it when the visitor switches to dark.
  themeColor: "#F4F1EA",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <StorageGate>{children}</StorageGate>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
