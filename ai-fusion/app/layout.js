import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import {shadcn} from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AiFusion: Battle of the Bots",
  description: "An AI-powered platform for seamless integration and innovation.",
};

export default function RootLayout({ children }) {
  return (
     <ClerkProvider
     appearence={{
      baseTheme: shadcn
     }}
     >
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
    </ClerkProvider>
  );
}
