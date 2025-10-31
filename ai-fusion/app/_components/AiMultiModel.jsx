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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

function AiMultiModel() {
  const { aiSelectedModels, setAiSelectedModels, messages, setMessages } =
    useContext(AiSelectedModelContext);
  const { user } = useUser();

  const [aiModelList, setAiModelList] = useState(
    AiModelList.map((model) => {
      // enable free models by default with first free submodel
      const firstFree = model.subModel.find((m) => !m.premium);
      return {
        ...model,
        enable: !!firstFree, // enable if free model exists
        defaultSubModel: firstFree ? firstFree.id : null,
      };
    })
  );

  // ------------------------
  // 🆕 Always start a new chat on refresh
  // ------------------------
  useEffect(() => {
    localStorage.removeItem("AiModelState");
    setMessages({});
    const defaultModels = AiModelList.map((model) => {
      const firstFree = model.subModel.find((m) => !m.premium);
      return {
        ...model,
        enable: !!firstFree,
        defaultSubModel: firstFree ? firstFree.id : null,
      };
    });

    setAiSelectedModels(
      defaultModels.reduce((acc, model) => {
        if (model.enable && model.defaultSubModel) {
          acc[model.model] = {
            modelId: model.defaultSubModel,
            enable: true,
          };
        }
        return acc;
      }, {})
    );

    setAiModelList(defaultModels);
  }, []);

  // ------------------------
  // Load Firebase data (optional)
  // ------------------------
  useEffect(() => {
    const loadUserState = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.id);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.modelState) {
          const { modelList, aiSelectedModels } = data.modelState;
          // re-apply only free models
          const updatedList = modelList.map((m) => {
            const firstFree = m.subModel.find((s) => !s.premium);
            return {
              ...m,
              enable: !!firstFree,
              defaultSubModel: firstFree ? firstFree.id : null,
            };
          });

          const updatedSelected = updatedList.reduce((acc, model) => {
            if (model.enable && model.defaultSubModel) {
              acc[model.model] = {
                modelId: model.defaultSubModel,
                enable: true,
              };
            }
            return acc;
          }, {});

          setAiModelList(updatedList);
          setAiSelectedModels(updatedSelected);
          setMessages({});
        }
      }
    };
    loadUserState();
  }, [user]);

  // ------------------------
  // Save to Firebase
  // ------------------------
  useEffect(() => {
    if (!user) return;
    const stateToSave = {
      modelList: aiModelList,
      messages,
      aiSelectedModels,
    };
    localStorage.setItem("AiModelState", JSON.stringify(stateToSave));

    const saveToFirebase = async () => {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, { modelState: stateToSave }, { merge: true });
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

  const onSelectValue = (model, value) => {
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
                    value={
                      aiSelectedModels?.[model.model]?.modelId ||
                      model.defaultSubModel ||
                      ""
                    }
                    onValueChange={(value) => onSelectValue(model.model, value)}
                    disabled={model.premium}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={
                          aiSelectedModels?.[model.model]?.modelId ||
                          model.defaultSubModel ||
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
