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
import AiModelList from "@/shared/AiModelList";
import { useAuth } from "@clerk/nextjs";

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
  const { has } = useAuth();
  const isPremiumUser = has;

  const { messages, setMessages } = useContext(AiSelectedModelContext);

  const isAnyModelEnabled = isPremiumUser
    ? AiModelList.length > 0
    : AiModelList.some((m) => m.enable && !m.premium);

  // ✅ Load chat or create new safely (client-side only)
  useEffect(() => {
    if (!params) return;
    const chatId_ = params.get("chatId");
    if (chatId_) {
      setChatId(chatId_);
      getMessages(chatId_);
    } else {
      const newChatId = uuidv4();
      setChatId(newChatId);
      setMessages({});
    }
  }, [params, setMessages]);

  const getMessages = async (chatId) => {
    if (!chatId) return;
    const docRef = doc(db, "chatHistory", chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setMessages(data.messages || {});
    }
  };

  const SaveMessages = async (updatedMessages) => {
    if (!chatId || !isLoaded) return;
    try {
      const docRef = doc(db, "chatHistory", chatId);
      await setDoc(
        docRef,
        {
          chatId,
          userEmail: user?.primaryEmailAddress?.emailAddress || "unknown",
          messages: updatedMessages,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("🔥 Firestore save error:", err);
    }
  };

  const handleSend = async (type = "text") => {
    if (!isLoaded) return;
    if (type === "text" && !userInput.trim()) return;

    if (!isPremiumUser && type !== "text") {
      toast.error("⚠️ File and audio uploads are for Premium users only.");
      return;
    }

    // Check remaining tokens
    const tokenRes = await axios.post("/api/user-remaining-msg", { token: 1 });
    const remainingToken = tokenRes?.data?.remainingToken;
    if (remainingToken <= 0) {
      toast.error("⚠️ You’ve reached your message limit.");
      return;
    }

    const userMessage =
      type === "text"
        ? { role: "user", content: userInput }
        : type === "file"
        ? { role: "user", content: `📎 Sent file: ${selectedFile?.name}` }
        : { role: "user", content: "🎤 Sent a voice note" };

    // Allowed models
    const allowedModels = isPremiumUser
      ? AiModelList
      : AiModelList.filter((m) => m.enable && !m.premium);

    if (!allowedModels.length) {
      toast.error("⚠️ No free AI models available for your plan.");
      return;
    }

    // Add message locally
    let updatedMessages = { ...messages };
    allowedModels.forEach((m) => {
      updatedMessages[m.model] = [...(updatedMessages[m.model] ?? []), userMessage];
    });
    setMessages(updatedMessages);
    SaveMessages(updatedMessages);

    // Clear input
    setUserInput("");
    setSelectedFile(null);
    setAudioBlob(null);

    // Send to each model
    for (const model of allowedModels) {
      const subModel = model.subModel.find((s) => !s.premium || isPremiumUser);
      if (!subModel) continue;

      const formData = new FormData();
      formData.append("model", subModel.id);
      formData.append("parentModel", model.model);
      formData.append(
        "msg",
        JSON.stringify([{ role: "user", content: userInput }])
      );

      // Show loading
      setMessages((prev) => ({
        ...prev,
        [model.model]: [
          ...(prev[model.model] ?? []),
          { role: "assistant", content: "Loading...", loading: true },
        ],
      }));

      try {
        const res = await axios.post("/api/aiMultiModel", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const aiResponse =
          res.data?.data?.aiResponse || res.data?.data?.response || "✅ Got your message!";

        setMessages((prev) => {
          const updated = [...(prev[model.model] ?? [])];
          const idx = updated.findIndex((m) => m.loading);
          if (idx !== -1) {
            updated[idx] = { role: "assistant", content: aiResponse, model: model.model };
          }
          const allUpdated = { ...prev, [model.model]: updated };
          SaveMessages(allUpdated);
          return allUpdated;
        });
      } catch (err) {
        console.error(`❌ ${model.model} error:`, err);
        setMessages((prev) => ({
          ...prev,
          [model.model]: [
            ...(prev[model.model] ?? []),
            { role: "assistant", content: "⚠️ Error fetching response." },
          ],
        }));
      }
    }
  };

  // Voice recording
  const handleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("🎤 Microphone denied:", err);
    }
  };

  useEffect(() => {
    if (audioBlob) handleSend("audio");
  }, [audioBlob]);

  return (
    <div className="relative h-screen">
      <AiMultiModel />
      <div className="fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4 bg-background">
          <input
            type="text"
            placeholder={
              isAnyModelEnabled
                ? "Ask me anything..."
                : "Enable a model to start chatting..."
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
              onClick={() => isAnyModelEnabled && fileInputRef.current?.click()}
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
                variant="ghost"
                size="icon"
                onClick={handleAudioRecording}
                disabled={!isAnyModelEnabled}
              >
                {isRecording ? (
                  <StopCircle className="text-red-500 h-6 w-6" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
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
