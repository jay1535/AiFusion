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

  useEffect(() => {
    const chatId_ = params.get("chatId");
    if(chatId_){
      setChatId(chatId_);
      getMessages(chatId_);
    }
    else{
setChatId(uuidv4());
    }
    
  }, [params]);

  const getMessages = async(chatId)=>{
    
 const docRef = doc(db, "chatHistory",chatId);
 const docSnap = await getDoc(docRef);
 console.log(docSnap.data());
 const docData = docSnap.data();
 setMessages(docData.messages);
 

  }

  // ✅ Check if at least one model is enabled
  const isAnyModelEnabled = Object.values(aiSelectedModels).some(
    (m) => m.enable
  );

  // ✅ Save messages to Firestore (safe)
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

  // ✅ Main Send Function
  const handleSend = async (type = "text") => {
    if (!isAnyModelEnabled) {
      console.warn("⚠️ No model enabled. Please enable at least one AI model before sending.");
      return;
    }

    if (type === "text" && (!userInput || !userInput.trim())) return;

    // Create user message
    const userMessage =
      type === "text"
        ? { role: "user", content: userInput }
        : type === "file"
        ? { role: "user", content: `📎 Sent a file: ${selectedFile?.name}` }
        : { role: "user", content: "🎤 Sent a voice note" };

    // Update messages locally first
    let updatedMessages = { ...messages };
    Object.keys(aiSelectedModels).forEach((key) => {
      if (aiSelectedModels[key].enable) {
        updatedMessages[key] = [...(updatedMessages[key] ?? []), userMessage];
      }
    });
    setMessages(updatedMessages);

    // ✅ Save immediately after user sends message
    SaveMessages(updatedMessages);

    const formData = new FormData();
    formData.append("parentModel", "");

    Object.entries(aiSelectedModels).forEach(([parentModel, modelInfo]) => {
      if (!modelInfo.enable || !modelInfo.modelId) return;

      formData.set("model", modelInfo.modelId);
      formData.set("parentModel", parentModel);

      if (type === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (type === "audio" && audioBlob) {
        formData.append("audio", audioBlob, "recording.wav");
      } else {
        formData.append(
          "msg",
          JSON.stringify([{ role: "user", content: userInput }])
        );
      }
    });

    setUserInput("");
    setSelectedFile(null);
    setAudioBlob(null);

    Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
      if (!modelInfo.enable || !modelInfo.modelId) return;

      // Show loading
      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] ?? []),
          {
            role: "assistant",
            content: "Loading...",
            model: parentModel,
            loading: true,
          },
        ],
      }));

      try {
        const result = await axios.post("/api/aiMultiModel", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { data } = result.data;
        const aiResponse =
          data?.aiResponse || data?.response || "✅ Got your message!";

        // Replace loading message
        setMessages((prev) => {
          const updated = [...(prev[parentModel] ?? [])];
          const idx = updated.findIndex((m) => m.loading);
          if (idx !== -1)
            updated[idx] = {
              role: "assistant",
              content: aiResponse,
              model: parentModel,
              loading: false,
            };
          const allUpdated = { ...prev, [parentModel]: updated };
          SaveMessages(allUpdated); // ✅ Save updated assistant response
          return allUpdated;
        });
      } catch (err) {
        console.error("Error:", err);
        setMessages((prev) => {
          const updated = {
            ...prev,
            [parentModel]: [
              ...(prev[parentModel] ?? []),
              { role: "assistant", content: "⚠️ Error sending message." },
            ],
          };
          SaveMessages(updated);
          return updated;
        });
      }
    });
  };

  // 🎤 Start / Stop Recording
  const handleAudioRecording = async () => {
    if (!isAnyModelEnabled) {
      console.warn("⚠️ No model enabled. Please enable one before recording.");
      return;
    }

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
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("🎤 Microphone access denied:", err);
    }
  };

  useEffect(() => {
    if (audioBlob) handleSend("audio");
  }, [audioBlob]);

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
                : "Enable at least one AI model to start chatting..."
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
              onClick={() => isAnyModelEnabled && fileInputRef.current.click()}
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
