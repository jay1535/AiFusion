"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./_components/AppSidebar";
import AppHeader from "./_components/AppHeader";
import { useUser } from "@clerk/clerk-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { DefaultModel } from "@/shared/AiModelsShared";

function Provider({ children, ...props }) {
  const {user} = useUser();
  const [aiSelectedModels, setAiSelectedModels] = useState(DefaultModel);
  useEffect(()=>{
    if(user){
      CreateNewUser();
    }
  })

  const CreateNewUser = async() =>{

    const userRef = doc(db, "users", user?.primaryEmailAddress?.emailAddress)
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
     const userData = {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.firstName + " " + user?.lastName,
        remainingMsg: 15,
        plan : "free",  
        credits : 1000,
        createdAt: new Date(),
      };
      await setDoc(userRef, userData);
    }


  }
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <AiSelectedModelContext.Provider value={{aiSelectedModels, setAiSelectedModels}}>
      <SidebarProvider>
        <AppSidebar/>
        
         
      <div className="w-full">
        <AppHeader/>{children}</div>
      </SidebarProvider>
      </AiSelectedModelContext.Provider>
    </NextThemesProvider>
  );
}

export default Provider;
