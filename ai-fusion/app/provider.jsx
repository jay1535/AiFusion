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
import { UserDetailContext } from "@/context/userDetailContext";

function Provider({ children, ...props }) {
  const { user } = useUser();
  const [aiSelectedModels, setAiSelectedModels] = useState(DefaultModel);
  const [userDetails, setUserDetails] = useState();
  const [messages, setMessages] = useState({});

  useEffect(() => {
    if (user) {
      CreateNewUser();
    }
  }, [user]);

  useEffect(() => {
    if (user && aiSelectedModels) {
      updateAiModelSelection();
    }
  }, [aiSelectedModels]);

  const updateAiModelSelection = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const docRef = doc(db, "users", email);
      await setDoc(docRef, { selectedModelPref: aiSelectedModels }, { merge: true });
      console.log("✅ Model selection updated in DB");
    } catch (error) {
      console.error("❌ Error updating model selection:", error);
    }
  };

  const CreateNewUser = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const userRef = doc(db, "users", email);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const userData = {
          email,
          name: `${user?.firstName || ""} ${user?.lastName || ""}`,
          remainingMsg: 15,
          plan: "free",
          credits: 1000,
          createdAt: new Date(),
        };
        await setDoc(userRef, userData);
        setUserDetails(userData);
        console.log("✅ New user created:", userData);
      } else {
        const userInfo = userSnap.data();
        if (userInfo.selectedModelPref) {
          setAiSelectedModels(userInfo.selectedModelPref ?? DefaultModel);
        }
        setUserDetails(userInfo);
        console.log("✅ Existing user loaded:", userInfo);
      }
    } catch (error) {
      console.error("❌ Error creating user:", error);
    }
  };

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
          value={{ aiSelectedModels, setAiSelectedModels, messages, setMessages }}
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="w-full">
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
