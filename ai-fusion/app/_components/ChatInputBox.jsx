"use client";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send, StopCircle } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import AiMultiModel from "./AiMultiModel";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function ChatInputBox() {
  const [userInput, setUserInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const fileInputRef = useRef(null);
  const [chatId, setChatId] = useState(null);

  const { user, isLoaded } = useUser();
  const params = useSearchParams();

  const { aiSelectedModels, messages, setMessages } = useContext(
    AiSelectedModelContext
  );

  // ✅ Load chat messages
  useEffect(() => {
    const chatId_ = params.get("chatId");
    if (chatId_) {
      setChatId(chatId_);
      getMessages(chatId_);
    } else {
      setMessages([]);
      setChatId(uuidv4());
    }
  }, [params]);

  const getMessages = async (chatId) => {
    const docRef = doc(db, "chatHistory", chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      setMessages(docData.messages || {});
    }
  };

  // ✅ Only allow free models
  const isAnyModelEnabled = Object.values(aiSelectedModels).some(
    (m) => m.enable && !m.premium
  );

  const SaveMessages = async (updatedMessages) => {
    if (!chatId || !isLoaded) return;
    try {
      const docRef = doc(db, "chatHistory", chatId);
      await setDoc(docRef, {
        chatId,
        userEmail: user?.primaryEmailAddress?.emailAddress || "unknown",
        messages: updatedMessages,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.error("🔥 Error saving messages:", err);
    }
  };

  // ✅ Handle send
  const handleSend = async (type = "text") => {
    if (!isAnyModelEnabled) {
      toast.error("Please enable at least one free model to start chatting.");
      return;
    }
    if (type === "text" && (!userInput || !userInput.trim())) return;

    // 🔹 Deduct token
    try {
      const res = await axios.post("/api/user-remaining-msg", { token: 1 });

      if (!res.data.allowed) {
        toast.error("⚠️ You’ve reached your free message limit. Upgrade to continue.");
        return;
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("⚠️ You’ve used all 10 free messages.");
      } else {
        toast.error("Something went wrong while checking tokens.");
        console.error("Token check failed:", err);
      }
      return;
    }

    // 🔹 Create user message
    const userMessage =
      type === "text"
        ? { role: "user", content: userInput }
        : type === "file"
        ? { role: "user", content: `📎 Sent file: ${selectedFile?.name}` }
        : { role: "user", content: "🎤 Sent a voice note" };

    // 🔹 Add locally
    let updatedMessages = { ...messages };
    Object.keys(aiSelectedModels).forEach((key) => {
      const modelInfo = aiSelectedModels[key];
      if (modelInfo.enable && !modelInfo.premium) {
        updatedMessages[key] = [...(updatedMessages[key] ?? []), userMessage];
      }
    });
    setMessages(updatedMessages);
    SaveMessages(updatedMessages);

    setUserInput("");
    setSelectedFile(null);
    setAudioBlob(null);
  };

  return (
    <div className="relative h-screen">
      <div>
        <AiMultiModel />
      </div>

      <div className="fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4 bg-background">
          <input
            type="text"
            placeholder={
              isAnyModelEnabled
                ? "Ask me anything..."
                : "Enable a free AI model to start chatting..."
            }
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend("text")}
            className="w-full border-0 outline-none bg-transparent text-sm placeholder-gray-500"
            disabled={!isAnyModelEnabled}
          />

          <div className="mt-3 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current.click()}
              disabled={!isAnyModelEnabled}
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                  handleSend("file");
                }
              }}
            />

            <div className="flex gap-4">
              <Button
                size="icon"
                onClick={() => handleSend("text")}
                disabled={!userInput.trim() || !isAnyModelEnabled}
              >
                <Send />
              </Button>
            </div>
          </div>

          {selectedFile && (
            <p className="text-xs text-gray-500 mt-2">📎 {selectedFile.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInputBox;
