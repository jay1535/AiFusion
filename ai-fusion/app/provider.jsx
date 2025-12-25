"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./_components/AppSidebar";
import AppHeader from "./_components/AppHeader";
import { useUser } from "@clerk/clerk-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { DefaultModel } from "@/shared/AiModelsShared";
import AiModelList from "@/shared/AiModelList";
import { UserDetailContext } from "@/context/userDetailContext";

/* =====================================================
   🔥 FIRESTORE SAFE NORMALIZER
===================================================== */
const normalizeModelSelection = (models) => {
  const safe = {};

  AiModelList.forEach((model) => {
    const incoming = models?.[model.model];

    const fallbackModelId =
      DefaultModel?.[model.model]?.modelId ??
      model.subModel?.[0]?.id ??
      null;

    safe[model.model] = {
      enable: incoming?.enable ?? true,
      modelId: incoming?.modelId ?? fallbackModelId, // 🚫 NEVER undefined
    };
  });

  return safe;
};

function Provider({ children, ...props }) {
  const { user } = useUser();

  const [aiSelectedModels, setAiSelectedModels] = useState({});
  const [messages, setMessages] = useState({});
  const [userDetails, setUserDetails] = useState(null);

  /* =====================================================
     CREATE / LOAD USER
  ===================================================== */
  useEffect(() => {
    if (user) {
      createOrLoadUser();
    }
  }, [user]);

  /* =====================================================
     SAVE MODEL PREF (SAFE)
  ===================================================== */
  useEffect(() => {
    if (user && Object.keys(aiSelectedModels).length > 0) {
      saveModelSelection();
    }
  }, [aiSelectedModels]);

  /* =====================================================
     SAVE MODEL PREF TO FIRESTORE
  ===================================================== */
  const saveModelSelection = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const safeSelection = normalizeModelSelection(aiSelectedModels);

      await setDoc(
        doc(db, "users", email),
        { selectedModelPref: safeSelection },
        { merge: true }
      );
    } catch (err) {
      console.error("❌ Error saving model preference:", err);
    }
  };

  /* =====================================================
     CREATE OR LOAD USER
  ===================================================== */
  const createOrLoadUser = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const ref = doc(db, "users", email);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const defaultModels = normalizeModelSelection(DefaultModel);

        const userData = {
          email,
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          remainingMsg: 15,
          plan: "free",
          credits: 1000,
          createdAt: new Date(),
          selectedModelPref: defaultModels,
        };

        await setDoc(ref, userData);

        setUserDetails(userData);
        setAiSelectedModels(defaultModels);
      } else {
        const data = snap.data();

        const safeModels = normalizeModelSelection(
          data.selectedModelPref ?? DefaultModel
        );

        setUserDetails(data);
        setAiSelectedModels(safeModels);
      }
    } catch (err) {
      console.error("❌ Error creating/loading user:", err);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
        <AiSelectedModelContext.Provider
          value={{
            aiSelectedModels,
            setAiSelectedModels,
            messages,
            setMessages,
          }}
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="w-full min-h-screen">
              <AppHeader />
              {children}
            </div>
          </SidebarProvider>
        </AiSelectedModelContext.Provider>
      </UserDetailContext.Provider>
    </NextThemesProvider>
  );
}

export default Provider;
