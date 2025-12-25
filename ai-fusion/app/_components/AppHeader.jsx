"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  UserButton,
  useUser,
  SignInButton,
} from "@clerk/clerk-react";
import Image from "next/image";

function AppHeader() {
  const { user } = useUser();
  const { open, setOpen } = useSidebar();

  return (
    <div className="p-3 w-full shadow-md flex justify-between items-center bg-background">
      {/* Left side: Logo or SidebarTrigger */}
      <div className="flex items-center gap-3">
        {open ? (
          <SidebarTrigger />
        ) : (
          <div
            className="flex items-center gap-2 select-none cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={36}
              height={36}
              className="rounded-md transition-transform hover:scale-105"
            />
            <span className="font-bold text-lg">AiFusion</span>
          </div>
        )}
      </div>

      {/* Right side: Sign In / UserButton */}
      <div>
        {!user ? (
          <SignInButton mode="modal">
            <Button variant="outline">Sign In</Button>
          </SignInButton>
        ) : (
          <UserButton />
        )}
      </div>
    </div>
  );
}

export default AppHeader;
