"use client";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import AiMultiModel from "./AiMultiModel";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import axios from "axios";

function ChatInputBox() {
  const [userInput, setUserInput] = useState("");
  const { aiSelectedModels, setAiSelectedModels, messages, setMessages } =
    useContext(AiSelectedModelContext);

  const handleSend = async () => {
    if (!userInput || !userInput.trim()) return;

    setMessages((prev) => {
      const updated = { ...prev };
      Object.keys(aiSelectedModels).forEach((modelKey) => {
        updated[modelKey] = [
          ...(updated[modelKey] ?? []),
          { role: "user", content: userInput },
        ];
      });
      return updated;
    });

    const currentInput = userInput;
    setUserInput("");

    Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
      if (!modelInfo.modelId) return;

      setMessages((prev) => ({
        ...prev,
        [parentModel]: [
          ...(prev[parentModel] ?? []),
          { role: "assistant", content: "Loading...", model: parentModel, loading: true },
        ],
      }));

      try {
        const result = await axios.post("/api/aiMultiModel", {
          model: modelInfo.modelId,
          msg: [{ role: "user", content: currentInput }],
          parentModel,
        });

        const { aiResponse, model } = result.data;

        setMessages((prev) => {
          const updated = [...(prev[parentModel] ?? [])];
          const loadingIndex = updated.findIndex((m) => m.loading);

          if (loadingIndex !== -1) {
            updated[loadingIndex] = { role: "assistant", content: aiResponse, model, loading: false };
          } else {
            updated.push({ role: "assistant", content: aiResponse, model, loading: false });
          }

          return { ...prev, [parentModel]: updated };
        });
      } catch (err) {
        console.error(err);
        setMessages((prev) => ({
          ...prev,
          [parentModel]: [...(prev[parentModel] ?? []), { role: "assistant", content: "⚠️ Error fetching response." }],
        }));
      }
    });
  };

  useEffect(() => {
    console.log(messages);
  }, [messages]);

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
            onKeyDown={(e) => {
              if (e.key === "Enter" && userInput.trim()) {
                handleSend();
              }
            }}
            className="w-full border-0 outline-none bg-transparent text-sm placeholder-gray-500"
          />
          <div className="mt-3 flex justify-between items-center">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5 font-bold" />
            </Button>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon">
                <Mic />
              </Button>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!userInput.trim()}
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

export default ChatInputBox;
