import type { Metadata, Viewport } from "next";
import { DevTools } from "@/components/DevTools";
import "./globals.css";

/* Absolute URLs for social cards. Drop app/icon.png, app/opengraph-image.png
   and app/twitter-image.png in and Next emits the tags on its own — this only
   has to supply the origin they resolve against. */
export const metadata: Metadata = {
  /* Social cards need absolute URLs; a localhost fallback means no image. */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  title: "Yokai Press  |  Free Custom Postage Stamp Maker Online",
  description:
    "Design custom postage stamps online, free. Control perforated edges, paper textures, content, and more. No sign-up. Export as PNG in seconds.",
  openGraph: {
    title: "Yokai Press  |  Free Custom Postage Stamp Maker Online",
    description:
      "Design custom postage stamps online, free. Control perforated edges, paper textures, content, and more. No sign-up. Export as PNG in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  /* The browser chrome should match the page ground, which differs by theme. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* The script below stamps data-theme before React hydrates, so the
       attribute is expected to differ from the server's markup. */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Settle the theme before the first paint. In an effect this both
            flashed the light theme and, worse, let the persistence write land
            before the preference was resolved — so a visitor whose system is
            dark was written down as "light" and stayed there. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('yokai-theme');" +
              "if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';" +
              "document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})()",
          }}
        />
        {/* Only the two faces the default stamp uses. The other six load on
            demand when a different face is picked. */}
        <link
          rel="preload"
          href="/fonts/bodoni.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/spacemono.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        {/* Annotation overlay for coding agents — development only, and
            behind a dynamic import so the package never reaches a production
            bundle. See components/DevTools.tsx. */}
        <DevTools />
      </body>
    </html>
  );
}
