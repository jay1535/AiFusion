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
import { Logs, MessageSquare, Moon, Sun, Zap } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import UsageCreditProgress from "./UsageCreditProgress";
import {
  collection,
  query,
  where,
  setDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import moment from "moment";
import Link from "next/link";
import axios from "axios";

const STATIC_LOGO = "/logo.svg";



function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const [chatHistory, setChatHistory] = useState([]);

  const [freeMessageCount, setFreeMessageCount] = useState(0);


  useEffect(() => setMounted(true), []);

  const getRemainingTokenMsgs=async()=>{
      const result = await axios.get("/api/user-remaining-msg")
      setFreeMessageCount(result?.data?.remainingToken);
    }

     useEffect(() => {
      user && getRemainingTokenMsgs();
    },[user]);

  // ✅ Real-time listener for chat history
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const q = query(
      collection(db, "chatHistory"),
      where("userEmail", "==", user.primaryEmailAddress.emailAddress)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map((doc) => doc.data())
        .filter((chat) => Object.keys(chat.messages || {}).length > 0)
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      setChatHistory(chats);
    });

    return () => unsubscribe();
  }, [user]);

  const getLastUserMessageFromChat = (chat) => {
    const allMessages = Object.values(chat.messages || {}).flat();
    const userMessages = allMessages.filter((msg) => msg.role === "user");
    const lastUserMessage =
      userMessages[userMessages.length - 1]?.content || "No message yet";
    const lastUpdated = chat.lastUpdated || Date.now();
    const formattedDate = moment(lastUpdated).format("MMM D, YYYY, h:mm A");
    return {
      chatId: chat.chatId,
      message: lastUserMessage,
      lastUpdated: formattedDate,
    };
  };

  if (!mounted) return null;

  return (
    <Sidebar>
      {/* HEADER */}
      <SidebarHeader>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <Image
                src={STATIC_LOGO}
                alt="Logo"
                width={30}
                height={30}
                className="rounded-md group-hover:rotate-6 transition-transform duration-200"
              />
              <h2 className="font-bold text-xl  transition-colors duration-200">
                AiFusion
              </h2>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="transition-colors duration-200 hover:bg-accent"
            >
              {theme === "light" ? <Sun /> : <Moon />}
            </Button>
          </div>

          {user ?
          <Link href={'/'}> 
            <Button className="w-full mt-5 transition-all duration-300">
              <MessageSquare /> New Chat
            </Button>
           </Link>: (
            <SignInButton>
              <Button className="w-full mt-5 transition-all duration-300">
                <MessageSquare /> New Chat
              </Button>
            </SignInButton>
          )}
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Logs className="text-gray-500" /> Chats
            </h2>

            {!user && (
              <p className="text-sm mt-2 text-muted-foreground">
                Sign in to view chat history.
              </p>
            )}

            {chatHistory.length === 0 && user && (
              <p className="text-sm mt-2 text-muted-foreground">
                No chat history yet.
              </p>
            )}

            {/* Chat History Cards */}
          
<div className="mt-4 flex flex-col gap-3">
  {chatHistory.map((chat, index) => {
    const lastMsg = getLastUserMessageFromChat(chat);
    return (
      <Link
        href={"?chatId=" + chat.chatId}
        key={index}
        className="
          relative overflow-hidden
          rounded-xl border border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-800/40
          shadow-sm
          transition-all duration-300 ease-out
          hover:shadow-md hover:-translate-y-[2px] hover:bg-gray-100 dark:hover:bg-gray-700/50
        "
      >
        <div className="flex items-start gap-3 p-3">
          <div className="flex-shrink-0 mt-1">
            <Image
              src={STATIC_LOGO}
              alt="Logo"
              width={24}
              height={24}
              className="rounded-md transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate transition-colors duration-200">
              {lastMsg.message}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lastMsg.lastUpdated}
            </span>
          </div>
        </div>
      </Link>
    );
  })}
</div>

          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <div className="p-3 mb-10">
          {!user ? (
            <SignInButton mode="modal">
              <Button className="w-full" size="lg">
                SignIn / SignUp
              </Button>
            </SignInButton>
          ) : (
            <div>
              <UsageCreditProgress remainingToken={freeMessageCount} />
              <Button className="w-full mb-3  transition-all duration-300">
                <Zap /> Upgrade to Pro
              </Button>
              <Button
                className="flex w-full hover:bg-accent transition-colors duration-200"
                variant="ghost"
              >
                <UserButton />
                <h2>Profile Settings</h2>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
