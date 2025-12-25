"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
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
import {
  SignInButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/nextjs";
import UsageCreditProgress from "./UsageCreditProgress";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import moment from "moment";
import Link from "next/link";
import axios from "axios";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import PricingModel from "./PricingModel";

const STATIC_LOGO = "/logo.svg";

function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user } = useUser();
  const { has, isLoaded: authLoaded } = useAuth();
  const { messages, setMessages } = useContext(AiSelectedModelContext);

  const [chatHistory, setChatHistory] = useState([]);
  const [freeMessageCount, setFreeMessageCount] = useState(0);

  /* ================= PREMIUM CHECK ================= */
  const isPremium = useMemo(() => {
    if (!authLoaded) return false;
    return has({ plan: "premium" });
  }, [authLoaded, has]);

  useEffect(() => setMounted(true), []);

  /* ================= MESSAGE COUNT (STABLE) ================= */
  const messageCount = useMemo(
    () => Object.keys(messages || {}).length,
    [messages]
  );

  /* ================= FETCH FREE MSGS ================= */
  useEffect(() => {
    if (!user || isPremium) return;

    const getRemainingTokenMsgs = async () => {
      try {
        const res = await axios.post("/api/user-remaining-msg", { token: 0 });
        setFreeMessageCount(res?.data?.remainingToken || 0);
      } catch {
        setFreeMessageCount(0);
      }
    };

    getRemainingTokenMsgs();
  }, [user?.id, isPremium, messageCount]);

  /* ================= CHAT HISTORY (ONLY IF LOGGED IN) ================= */
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setChatHistory([]);
      return;
    }

    const q = query(
      collection(db, "chatHistory"),
      where(
        "userEmail",
        "==",
        user.primaryEmailAddress.emailAddress
      )
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map((doc) => doc.data())
        .filter((c) => Object.keys(c.messages || {}).length > 0)
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

      setChatHistory(chats);
    });

    return () => unsub();
  }, [user?.primaryEmailAddress?.emailAddress]);

  const handleNewChat = () => {
    setMessages({});
    localStorage.removeItem("currentChatId");
  };

  if (!mounted) return null;

  return (
    <Sidebar>
      {/* ================= HEADER ================= */}
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src={STATIC_LOGO} alt="Logo" width={30} height={30} />
              <h2 className="font-bold text-xl tracking-tight">
                AiFusion
              </h2>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "light" ? "dark" : "light")
              }
            >
              {theme === "light" ? <Sun /> : <Moon />}
            </Button>
          </div>

          <Link href="/" onClick={handleNewChat}>
            <Button className="w-full mt-5 gap-2">
              <MessageSquare className="w-4 h-4" />
              New Chat
            </Button>
          </Link>
        </div>
      </SidebarHeader>

      {/* ================= CONTENT ================= */}
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
              <Logs className="w-4 h-4" /> Chats
            </h2>

            {/* 🔒 NOT LOGGED IN → NO CHATS */}
            {!user && (
              <p className="mt-4 text-sm text-muted-foreground">
                Sign in to view your chats
              </p>
            )}

            {/* ✅ LOGGED IN → SHOW CHATS */}
            {user && (
              <div className="mt-4 flex flex-col gap-3">
                {chatHistory.map((chat, index) => {
                  const msgs = Object.values(chat.messages || {}).flat();
                  const lastMsg =
                    msgs
                      .filter((m) => m.role === "user")
                      .pop()?.content || "No message";

                  const date = moment(chat.lastUpdated).format(
                    "MMM D • h:mm A"
                  );

                  return (
                    <Link
                      key={index}
                      href={"?chatId=" + chat.chatId}
                      className="rounded-lg border bg-muted/40 hover:bg-muted transition px-3 py-2"
                    >
                      <p className="text-sm font-medium truncate">
                        {lastMsg}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {date}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* ================= FOOTER ================= */}
      <SidebarFooter>
        <div className="px-4 pb-4 space-y-4">
          {!user && (
            <SignInButton mode="modal">
              <Button className="w-full" size="lg">
                Sign In / Sign Up
              </Button>
            </SignInButton>
          )}

          {/* 🔥 FREE USAGE (ONLY FREE USERS) */}
          {authLoaded && user && !isPremium && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Free Plan
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Limited
                  </span>
                </div>

                <UsageCreditProgress
                  remainingToken={freeMessageCount}
                />

                <PricingModel>
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  >
                    <Zap className="w-4 h-4" />
                    Upgrade to Premium
                  </Button>
                </PricingModel>
              </div>
            </>
          )}

          {user && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <UserButton />
              <span className="text-sm">Profile Settings</span>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
