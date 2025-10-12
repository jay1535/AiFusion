"use client";
import React, { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { MessageSquare, Moon, Sun } from "lucide-react";

function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={"/logo.svg"}
                alt="Logo"
                width={40}
                height={40}
                className="w-[30px] h-[30px]"
              />
              <h2 className="font-bold text-xl">AiFusion</h2>
            </div>
            <div>
              {theme === "light" ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme("dark")}
                >
                  <Sun />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme("light")}
                >
                  <Moon />
                </Button>
              )}
            </div>
          </div>
          <Button className="w-full mt-5">
            <MessageSquare /> New Chat
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold text-lg">Chat</h2>
            <p className="text-sm mt-2 text-muted-foreground">
              Start a new conversation by clicking the "New Chat" button above.
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3 mb-10">
          <Button className="w-full" size="lg">
            SignIn / SignUp
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
