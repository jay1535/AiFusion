"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/clerk-react";
import Image from "next/image";

function AppHeader() {
  const { isSignedIn } = useUser();
  const { open, setOpen } = useSidebar(); // get sidebar state + control

  return (
    <div className="p-3 w-full shadow-md flex justify-between items-center bg-background">
      <div className="flex items-center gap-3">
        {/* Automatically switch based on sidebar state */}
        {open ? (
          <SidebarTrigger />
        ) : (
          <div
            className="flex items-center gap-2 select-none cursor-pointer"
            onClick={() => setOpen(true)} // <-- opens sidebar on logo click
          >
            <Image
              src="/logo.svg" // replace with your actual logo
              alt="Logo"
              width={36}
              height={36}
              className="rounded-md transition-transform hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Right side - Clerk button */}
      <div>
        {!isSignedIn ? (
          <Button variant="outline">Sign In</Button>
        ) : (
          <UserButton afterSignOutUrl="/" />
        )}
      </div>
    </div>
  );
}

export default AppHeader;
