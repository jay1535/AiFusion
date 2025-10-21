"use client";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send, StopCircle } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import AiMultiModel from "./AiMultiModel";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import axios from "axios";

function ChatInputBox() {
  const [userInput, setUserInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const fileInputRef = useRef(null);

  const { aiSelectedModels, messages, setMessages } = useContext(AiSelectedModelContext);

  const handleSend = async (type = "text") => {
    if (type === "text" && (!userInput || !userInput.trim())) return;

    // Add user message
    const userMessage =
      type === "text"
        ? { role: "user", content: userInput }
        : type === "file"
        ? { role: "user", content: `📎 Sent a file: ${selectedFile?.name}` }
        : { role: "user", content: "🎤 Sent a voice note" };

    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((key) => {
        updated[key] = [...(updated[key] ?? []), userMessage];
      });
      return updated;
    });

    const formData = new FormData();
    formData.append("parentModel", "");
    Object.entries(aiSelectedModels).forEach(([parentModel, modelInfo]) => {
      if (!modelInfo.modelId) return;
      formData.set("model", modelInfo.modelId);
      formData.set("parentModel", parentModel);

      if (type === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (type === "audio" && audioBlob) {
        formData.append("audio", audioBlob, "recording.wav");
      } else {
        formData.append("msg", JSON.stringify([{ role: "user", content: userInput }]));
      }
    });

    setUserInput("");
    setSelectedFile(null);
    setAudioBlob(null);

    Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
      if (!modelInfo.modelId) return;

      // show loading message
      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] ?? []),
          { role: "assistant", content: "Loading...", model: parentModel, loading: true },
        ],
      }));

      try {
        const result = await axios.post("/api/aiMultiModel", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { data } = result.data;
        const aiResponse = data?.aiResponse || data?.response || "✅ Got your message!";

        // Replace loading with real response
        setMessages((prev) => {
          const updated = [...(prev[parentModel] ?? [])];
          const idx = updated.findIndex((m) => m.loading);
          if (idx !== -1) updated[idx] = { role: "assistant", content: aiResponse, model: parentModel, loading: false };
          return { ...prev, [parentModel]: updated };
        });
      } catch (err) {
        console.error("Error:", err);
        setMessages((prev) => ({
          ...prev,
          [parentModel]: [
            ...(prev[parentModel] ?? []),
            { role: "assistant", content: "⚠️ Error sending message." },
          ],
        }));
      }
    });
  };

  // 🎤 Start / Stop Recording
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
            placeholder="Ask me anything..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend("text")}
            className="w-full border-0 outline-none bg-transparent text-sm placeholder-gray-500"
          />

          <div className="mt-3 flex justify-between items-center">
            {/* 📎 File Upload */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current.click()}
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

            {/* 🎤 Mic & Send */}
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" onClick={handleAudioRecording}>
                {isRecording ? (
                  <StopCircle className="text-red-500 h-6 w-6" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              <Button
                size="icon"
                onClick={() => handleSend("text")}
                disabled={!userInput.trim()}
              >
                <Send />
              </Button>
            </div>
          </div>

          {/* Show selected file name */}
          {selectedFile && (
            <p className="text-xs text-gray-500 mt-2">
              📎 {selectedFile.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInputBox;
