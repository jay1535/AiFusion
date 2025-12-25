"use client";

import React, { createContext, useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useUser } from "@clerk/clerk-react";
import { db } from "@/config/FirebaseConfig";
import AiModelList from "@/shared/AiModelList";
import { DefaultModel } from "@/shared/AiModelsShared";
import { sanitizeForFirestore } from "@/utils/sanitizeForFirestore";

export const AiSelectedModelContext = createContext(null);

export default function Provider({ children }) {
  const { user } = useUser();

  const [aiSelectedModels, setAiSelectedModels] = useState({});
  const [messages, setMessages] = useState({});

  /* ================= PREMIUM CHECK ================= */
  const isPremium =
    user?.publicMetadata?.plan === "premium" ||
    user?.privateMetadata?.isPremium === true;

  /* ================= INIT MODELS (NO UNDEFINED) ================= */
  useEffect(() => {
    if (!user) return;

    const initialModels = {};

    AiModelList.forEach((model) => {
      const freeSub =
        DefaultModel[model.model]?.modelId ?? null;

      const premiumSub =
        model.subModel?.[0]?.id ?? null;

      const modelId = isPremium ? premiumSub : freeSub;

      initialModels[model.model] = {
        enable: true,
        modelId: modelId ?? null, // ✅ NEVER undefined
      };
    });

    setAiSelectedModels(initialModels);

    /* ================= SAVE TO FIRESTORE ================= */
    const ref = doc(db, "users", user.id);

    setDoc(
      ref,
      sanitizeForFirestore({
        selectedModelPref: initialModels,
      }),
      { merge: true }
    );
  }, [user, isPremium]);

  return (
    <AiSelectedModelContext.Provider
      value={{
        messages,
        setMessages,
        aiSelectedModels,
        setAiSelectedModels,
      }}
    >
      {children}
    </AiSelectedModelContext.Provider>
  );
}
