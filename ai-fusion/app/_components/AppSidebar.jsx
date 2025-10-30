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

const STATIC_LOGO = "/logo.svg";

function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => setMounted(true), []);

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
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      setChatHistory(chats);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Firestore-safe chat save (avoid undefined)
  const saveChatHistory = async (chatId, messages, model) => {
    try {
      const userId = user?.id || "unknown_user";
      const userEmail =
        user?.primaryEmailAddress?.emailAddress || "unknown_email@example.com";

      const chatData = {
        chatId,
        messages,
        model: model || "",
        userId,
        userEmail,
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "chatHistory", chatId), chatData);
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  };

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
            <div className="flex items-center gap-3">
              <Image
                src={STATIC_LOGO}
                alt="Logo"
                width={30}
                height={30}
                className="rounded-md"
              />
              <h2 className="font-bold text-xl">AiFusion</h2>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Sun /> : <Moon />}
            </Button>
          </div>

          {user ? (
            <Button className="w-full mt-5">
              <MessageSquare /> New Chat
            </Button>
          ) : (
            <SignInButton>
              <Button className="w-full mt-5">
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
              <Logs /> Chats
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

            {chatHistory.map((chat, index) => {
              const lastMsg = getLastUserMessageFromChat(chat);
              return (
                <div
                  key={index}
                  className="p-3 mt-3 rounded-lg hover:bg-accent transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <Image
                      src={STATIC_LOGO}
                      alt="Logo"
                      width={20}
                      height={20}
                      className="rounded-sm mt-1"
                    />
                    {/* ✅ FULL MESSAGE — multi-line, not truncated */}
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-snug">
                        {lastMsg.message}
                      </span>
                      {/* ✅ Time & Date below */}
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {lastMsg.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <UsageCreditProgress />
              <Button className="w-full mb-3">
                <Zap /> Upgrade to Pro
              </Button>
              <Button className="flex w-full" variant="ghost">
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
