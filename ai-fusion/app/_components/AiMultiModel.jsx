"use client";
import AiModelList from "@/shared/AiModelList";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { useUser } from "@clerk/clerk-react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

function AiMultiModel() {
  const { aiSelectedModels, setAiSelectedModels, messages, setMessages } =
    useContext(AiSelectedModelContext);

  const { user } = useUser();
  const [aiModelList, setAiModelList] = useState(
    AiModelList.map((model) => ({
      ...model,
      enable: false,
    }))
  );

  // ------------------------
  // Load state on startup
  // ------------------------
  useEffect(() => {
    const loadUserState = async () => {
      // 1️⃣ Try localStorage first (fast)
      const localData = localStorage.getItem("AiModelState");
      if (localData) {
        const parsed = JSON.parse(localData);
        setAiModelList(parsed.modelList || aiModelList);
        setMessages(parsed.messages || {});
        setAiSelectedModels(parsed.aiSelectedModels || {});
      }

      // 2️⃣ Then sync with Firebase (latest data)
      if (user) {
        const userRef = doc(db, "users", user.id);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.modelState) {
            setAiModelList(data.modelState.modelList);
            setMessages(data.modelState.messages || {});
            setAiSelectedModels(data.modelState.aiSelectedModels || {});
          }
        }
      }
    };

    loadUserState();
  }, [user]);

  // ------------------------
  // Save state whenever it changes
  // ------------------------
  useEffect(() => {
    if (!user) return;
    const stateToSave = {
      modelList: aiModelList,
      messages,
      aiSelectedModels,
    };

    // 1️⃣ LocalStorage (instant)
    localStorage.setItem("AiModelState", JSON.stringify(stateToSave));

    // 2️⃣ Firebase (persistent)
    const saveToFirebase = async () => {
      const userRef = doc(db, "users", user.id);
      await setDoc(
        userRef,
        { modelState: stateToSave },
        { merge: true }
      );
    };
    saveToFirebase();
  }, [aiModelList, messages, aiSelectedModels, user]);

  // ------------------------
  // Handlers
  // ------------------------
  const onToggleChange = (model, value) => {
    setAiModelList((prev) =>
      prev.map((item) =>
        item.model === model ? { ...item, enable: value } : item
      )
    );
    setAiSelectedModels((prev) => ({
      ...prev,
      [model]: { ...(prev?.[model] ?? {}), enable: value },
    }));
  };

  const onSelectValue = async (model, value) => {
    const updated = {
      ...aiSelectedModels,
      [model]: { modelId: value || "" },
    };
    setAiSelectedModels(updated);
  };

  const formatMessageContent = (content) => {
    const cleanContent = content.replace(/[^\w\s.,!?'"():%-]/g, "");
    const lines = cleanContent.split("\n");

    return lines.map((line, idx) => {
      line = line.trim();
      if (!line) return null;

      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm leading-relaxed">
            {line.substring(2)}
          </li>
        );
      }

      if (line.endsWith(":")) {
        return (
          <h3
            key={idx}
            className="text-[15px] font-semibold text-gray-100 mt-2 mb-1"
          >
            {line}
          </h3>
        );
      }

      return (
        <p
          key={idx}
          className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed"
        >
          {line}
        </p>
      );
    });
  };

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="flex flex-row overflow-x-auto no-scrollbar gap-4 mt-2 h-[70vh] p-4">
      {aiModelList.map((model, index) => {
        const hasFreeModels = model.subModel.some((m) => !m.premium);
        const hasPremiumModels = model.subModel.some((m) => m.premium);

        return (
          <div
            key={index}
            className={`flex flex-col border rounded-2xl shadow-md bg-card/20 
              hover:bg-card/30 transition-all duration-200
              h-full p-4 ${
                model.enable
                  ? "min-w-[400px] max-w-[420px]"
                  : "min-w-[160px]"
              }`}
          >
            {/* Header */}
            <div className="flex w-full items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src={model.icon}
                  alt={model.model}
                  width={28}
                  height={28}
                  className="rounded-md"
                />

                {model.enable && (
                  <Select
                    defaultValue={
                      aiSelectedModels?.[model.model]?.modelId || ""
                    }
                    onValueChange={(value) =>
                      onSelectValue(model.model, value)
                    }
                    disabled={model.premium}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={
                          aiSelectedModels?.[model.model]?.modelId ||
                          "Select Model"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup className="px-3">
                        <SelectLabel className="text-sm text-gray-400">
                          Free
                        </SelectLabel>
                        {hasFreeModels ? (
                          model.subModel.map(
                            (subModel, i) =>
                              !subModel.premium && (
                                <SelectItem key={i} value={subModel.id}>
                                  {subModel.name}
                                </SelectItem>
                              )
                          )
                        ) : (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 px-2 py-1">
                            <Lock className="w-4 h-4" />
                            Upgrade for Premium
                          </div>
                        )}
                      </SelectGroup>

                      {hasPremiumModels && (
                        <SelectGroup className="px-3">
                          <SelectLabel className="text-sm text-gray-400">
                            Premium
                          </SelectLabel>
                          {model.subModel.map(
                            (subModel, i) =>
                              subModel.premium && (
                                <SelectItem
                                  key={i}
                                  value={subModel.id}
                                  disabled
                                >
                                  {subModel.name}
                                  <Lock className="inline-block ml-2 w-4 h-4" />
                                </SelectItem>
                              )
                          )}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {model.enable ? (
                <Switch
                  checked={model.enable}
                  onCheckedChange={(v) => onToggleChange(model.model, v)}
                />
              ) : (
                <MessageSquare
                  className="cursor-pointer"
                  onClick={() => onToggleChange(model.model, true)}
                />
              )}
            </div>

            {model.premium && model.enable && (
              <div className="flex items-center justify-center h-full">
                <Button>
                  <Lock className="mr-2 w-4 h-4" /> Upgrade To Unlock
                </Button>
              </div>
            )}

            {/* Messages Section */}
            {model.enable && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {(messages[model.model] || []).map((m, i) => (
                  <div
                    key={i}
                    className={`flex w-full ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[75%] shadow-sm ${
                        m.role === "user"
                          ? "self-end font-[cursive] bg-blue-100 text-blue-900 dark:bg-gray-800 dark:text-white"
                          : "bg-gray-100 text-blue-900 border border-gray-300 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {m.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Image
                            src={model.icon}
                            alt="model-logo"
                            width={18}
                            height={18}
                            className="rounded-sm opacity-80"
                          />
                          <span className="text-xs text-gray-400 font-medium">
                            {m.model ?? model.model}
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-line">
                        {m.role === "assistant"
                          ? formatMessageContent(m.content)
                          : m.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AiMultiModel;
