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
import { DefaultModel } from "@/shared/AiModelsShared";

/* =====================================================
   🔐 HELPERS
===================================================== */
const isModelAllowed = ({ modelName, modelId, isPremium }) => {
  if (!modelId) return false;

  // Free user → only default/free sub-model allowed
  if (!isPremium) {
    return DefaultModel[modelName]?.modelId === modelId;
  }

  // Premium user → all models allowed
  return true;
};

export default function ChatInputBox() {
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

  const { messages, setMessages, aiSelectedModels } =
    useContext(AiSelectedModelContext);

  /* =====================================================
     ✅ PREMIUM CHECK (FINAL & SAFE)
  ===================================================== */
  const isPremium =
    user?.publicMetadata?.plan === "premium" ||
    user?.privateMetadata?.isPremium === true;

  /* =====================================================
     ✅ FINAL SOURCE OF TRUTH — ENABLED & ALLOWED MODELS
  ===================================================== */
  const enabledModels = Object.entries(aiSelectedModels)
    .filter(([modelName, config]) => {
      if (!config?.enable) return false;

      return isModelAllowed({
        modelName,
        modelId: config.modelId,
        isPremium,
      });
    })
    .map(([modelName, config]) => ({
      model: modelName,
      modelId: config.modelId,
    }));

  const isAnyModelEnabled = enabledModels.length > 0;

  /* =====================================================
     LOAD / CREATE CHAT
  ===================================================== */
  useEffect(() => {
    const id = params.get("chatId");
    if (id) {
      setChatId(id);
      loadMessages(id);
    } else {
      const newId = uuidv4();
      setChatId(newId);
      setMessages({});
    }
  }, [params]);

  const loadMessages = async (id) => {
    const ref = doc(db, "chatHistory", id);
    const snap = await getDoc(ref);
    if (snap.exists()) setMessages(snap.data().messages || {});
  };

  /* =====================================================
     SAVE CHAT (SANITIZED)
  ===================================================== */
  const saveMessages = async (updated, firstMsg = null) => {
    if (!chatId || !isLoaded) return;

    const safe = JSON.parse(JSON.stringify(updated));

    await setDoc(
      doc(db, "chatHistory", chatId),
      {
        chatId,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        messages: safe,
        lastUpdated: Date.now(),
        ...(firstMsg && { title: firstMsg }),
      },
      { merge: true }
    );
  };

  /* =====================================================
     SEND MESSAGE (ONLY ALLOWED MODELS)
  ===================================================== */
  const handleSend = async (type = "text") => {
    if (!isLoaded) return;
    if (type === "text" && !userInput.trim()) return;

    if (!isAnyModelEnabled) {
      toast.error("Enable at least one valid AI model.");
      return;
    }

    // Token check
    const tokenRes = await axios.post("/api/user-remaining-msg", { token: 1 });
    if (tokenRes?.data?.remainingToken <= 0) {
      toast.error("Message limit reached.");
      return;
    }

    const userMessage =
      type === "text"
        ? { role: "user", content: userInput }
        : type === "file"
        ? { role: "user", content: `📎 ${selectedFile?.name}` }
        : { role: "user", content: "🎤 Voice message" };

    /* ➕ Add user message ONLY to allowed models */
    let updated = { ...messages };
    enabledModels.forEach(({ model }) => {
      updated[model] = [...(updated[model] ?? []), userMessage];
    });

    setMessages(updated);

    const isFirst =
      Object.values(messages).every((arr) => arr.length === 0);

    await saveMessages(updated, isFirst ? userInput : null);

    setUserInput("");
    setSelectedFile(null);
    setAudioBlob(null);

    /* ⏳ Thinking state */
    setMessages((prev) => {
      const next = { ...prev };
      enabledModels.forEach(({ model }) => {
        next[model] = [
          ...(next[model] ?? []),
          { role: "assistant", content: "Thinking...", loading: true },
        ];
      });
      return next;
    });

    /* 🚀 Parallel AI calls */
    await Promise.all(
      enabledModels.map(async ({ model, modelId }) => {
        try {
          const formData = new FormData();
          formData.append("model", modelId);
          formData.append("parentModel", model);
          formData.append(
            "msg",
            JSON.stringify([{ role: "user", content: userInput }])
          );

          const res = await axios.post("/api/aiMultiModel", formData);
          const aiResponse =
            res.data?.data?.aiResponse ||
            res.data?.data?.response ||
            "Response received";

          setMessages((prev) => {
            const msgs = [...(prev[model] ?? [])];
            const idx = msgs.findIndex((m) => m.loading);
            if (idx !== -1)
              msgs[idx] = { role: "assistant", content: aiResponse };

            const next = { ...prev, [model]: msgs };
            saveMessages(next);
            return next;
          });
        } catch {
          setMessages((prev) => {
            const msgs = [...(prev[model] ?? [])];
            const idx = msgs.findIndex((m) => m.loading);
            if (idx !== -1)
              msgs[idx] = {
                role: "assistant",
                content: "❌ Failed to respond.",
              };
            return { ...prev, [model]: msgs };
          });
        }
      })
    );
  };

  /* =====================================================
     AUDIO
  ===================================================== */
  const handleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunks.current = [];

    recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
    recorder.onstop = () => {
      setAudioBlob(new Blob(audioChunks.current, { type: "audio/wav" }));
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  useEffect(() => {
    if (audioBlob) handleSend("audio");
  }, [audioBlob]);

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="relative h-screen">
      <AiMultiModel />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="rounded-2xl border bg-background shadow-lg p-4">
          <input
            className="w-full bg-transparent outline-none text-sm"
            placeholder={
              isAnyModelEnabled
                ? "Ask anything…"
                : "Enable a valid model to chat…"
            }
            value={userInput}
            disabled={!isAnyModelEnabled}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <div className="mt-3 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              disabled={!isAnyModelEnabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip />
            </Button>

            <input
              ref={fileInputRef}
              hidden
              type="file"
              onChange={(e) => {
                setSelectedFile(e.target.files[0]);
                handleSend("file");
              }}
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                disabled={!isAnyModelEnabled}
                onClick={handleAudioRecording}
              >
                {isRecording ? (
                  <StopCircle className="text-red-500" />
                ) : (
                  <Mic />
                )}
              </Button>

              <Button
                size="icon"
                disabled={!userInput.trim() || !isAnyModelEnabled}
                onClick={() => handleSend()}
              >
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
