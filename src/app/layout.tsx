import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const title = "VPN Control Center | KeenVPN";
const description =
  "Manage your KeenVPN account, subscription, and server locations.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  title,
  description,
  icons: {
    icon: "/keenvpn-mark.svg",
    shortcut: "/keenvpn-mark.svg",
    apple: "/keenvpn-mark.svg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "VPN Control Center by KeenVPN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
