"use client";

import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
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
import {
  Lock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUser } from "@clerk/clerk-react";

import AiModelList from "@/shared/AiModelList";
import { DefaultModel } from "@/shared/AiModelsShared";
import { db } from "@/config/FirebaseConfig";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";

/* =====================================================
   HELPERS
===================================================== */
const isFreeModel = (modelName, subModelId) =>
  DefaultModel[modelName]?.modelId === subModelId;

/* =====================================================
   MESSAGE FORMATTERS
===================================================== */
const cleanText = (text = "") =>
  text
    .replace(/[*#`]+/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const renderAssistantMessage = (content) =>
  cleanText(content)
    .split("\n")
    .map((line, i) => {
      const t = line.trim();
      if (!t) return null;

      if (/^[-•]/.test(t)) {
        return (
          <li key={i} className="ml-4 list-disc text-sm">
            {t.replace(/^[-•]\s*/, "")}
          </li>
        );
      }

      if (t.endsWith(":")) {
        return (
          <p key={i} className="mt-3 font-semibold text-sm">
            {t}
          </p>
        );
      }

      return (
        <p key={i} className="text-sm leading-relaxed">
          {t}
        </p>
      );
    });

export default function AiMultiModel({ activeChatId }) {
  const { messages, setMessages, aiSelectedModels, setAiSelectedModels } =
    useContext(AiSelectedModelContext);

  const { user } = useUser();

  const isPremium =
    user?.publicMetadata?.plan === "premium" ||
    user?.privateMetadata?.isPremium === true;

  /* =====================================================
     MODEL META
  ===================================================== */
  const [models] = useState(() =>
    AiModelList.map((m) => ({
      ...m,
      freeSubModels: m.subModel.filter((s) =>
        isFreeModel(m.model, s.id)
      ),
      premiumSubModels: m.subModel.filter(
        (s) => !isFreeModel(m.model, s.id)
      ),
    }))
  );

  /* =====================================================
     INIT CONTEXT
  ===================================================== */
  useEffect(() => {
    setAiSelectedModels((prev) => {
      const next = { ...prev };

      models.forEach((model) => {
        if (!next[model.model]) {
          const defaultSub =
            isPremium
              ? model.subModel[0]?.id
              : model.freeSubModels[0]?.id;

          if (!defaultSub) return;

          next[model.model] = {
            enable: true,
            modelId: defaultSub,
          };
        }
      });

      return next;
    });
  }, [models, isPremium, setAiSelectedModels]);

  /* =====================================================
     LOAD CHAT
  ===================================================== */
  useEffect(() => {
    if (!user || !activeChatId) return;

    const load = async () => {
      const ref = doc(db, "users", user.id, "chats", activeChatId);
      const snap = await getDoc(ref);
      setMessages(snap.exists() ? snap.data().messages || {} : {});
    };

    load();
  }, [user, activeChatId, setMessages]);

  /* =====================================================
     SAVE CHAT
  ===================================================== */
  useEffect(() => {
    if (!user || !activeChatId) return;

    const safe = JSON.parse(JSON.stringify(messages));

    setDoc(
      doc(db, "users", user.id, "chats", activeChatId),
      { messages: safe, updatedAt: Date.now() },
      { merge: true }
    );
  }, [messages, user, activeChatId]);

  /* =====================================================
     HANDLERS
  ===================================================== */
  const toggleModel = (model, value) => {
    setAiSelectedModels((prev) => ({
      ...prev,
      [model]: { ...prev[model], enable: value },
    }));
  };

  const selectSubModel = (model, value) => {
    if (!isPremium && !isFreeModel(model, value)) return;

    setAiSelectedModels((prev) => ({
      ...prev,
      [model]: { ...prev[model], modelId: value },
    }));
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="flex gap-6 px-6 py-5 overflow-x-auto scrollbar-hide">
      {models.map((model) => {
        const state = aiSelectedModels[model.model];
        const enabled = !!state?.enable;

        return (
          <div
            key={model.model}
            className={`
              shrink-0 rounded-2xl border bg-background
              shadow-sm hover:shadow-md transition
              w-[320px] sm:w-[360px] lg:w-[400px]
              h-[440px]
              flex flex-col
              ${enabled ? "opacity-100" : "opacity-60"}
            `}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
              {/* LEFT: ICON + NAME */}
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src={model.icon}
                  alt={model.model}
                  width={22}
                  height={22}
                />
                <span className="text-sm font-medium truncate">
                  {model.model}
                </span>
              </div>

              {/* RIGHT: SUBMODEL + TOGGLE */}
              <div className="flex items-center gap-2">
                <Select
                  value={state?.modelId || ""}
                  onValueChange={(v) =>
                    selectSubModel(model.model, v)
                  }
                  disabled={!enabled}
                >
                  <SelectTrigger className="h-7 text-xs w-[120px]">
                    <SelectValue placeholder="Variant" />
                  </SelectTrigger>

                  <SelectContent>
                    {model.freeSubModels.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Free</SelectLabel>
                        {model.freeSubModels.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {model.premiumSubModels.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Premium</SelectLabel>
                        {model.premiumSubModels.map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id}
                            disabled={!isPremium}
                          >
                            {s.name}
                            {!isPremium && (
                              <Lock className="inline ml-2 w-3 h-3" />
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                {enabled ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}

                <Switch
                  checked={enabled}
                  onCheckedChange={(v) =>
                    toggleModel(model.model, v)
                  }
                />
              </div>
            </div>

            {/* CHAT */}
            <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
              {(messages[model.model] || []).length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  No messages yet
                </div>
              )}

              {(messages[model.model] || []).map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%] rounded-xl px-3 py-2 bg-muted">
                    {m.role === "assistant" ? (
                      <ul className="space-y-1">
                        {renderAssistantMessage(m.content)}
                      </ul>
                    ) : (
                      <p className="text-sm">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
