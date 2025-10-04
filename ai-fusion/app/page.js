"use client";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function Home() {
  const { setTheme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Button onClick={() => setTheme("dark")}>
        Dark Mode
      </Button>
      <Button onClick={() => setTheme("light")}>
        Light mode
      </Button>
    </div>

  );
}
