"use client";
import AiModelList from "@/shared/AiModelList";
import Image from "next/image";
import React, { useContext, useState } from "react";
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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";

function AiMultiModel() {
  const {aiSelectedModels, setAiSelectedModels} = useContext(AiSelectedModelContext);
  const [aiModelList, setAiModelList] = useState(AiModelList);
  const {user} = useUser();

  const onToggleChange = (model, value) => {
    setAiModelList((prevList) =>
      prevList.map((item) =>
        item.model === model ? { ...item, enable: value } : item
      )
    );
  };

  const onSelectValue = async(model, value) => {
    setAiSelectedModels((prevSelected) => ({
      ...prevSelected,
      [model]: { modelId: value },
    }));
    //Update to FireBase
    const docRef =doc (db, "users", user?.primaryEmailAddress?.emailAddress);
    await updateDoc(docRef, {
      selectedModelPref : aiSelectedModels
    }
    )
  }
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

                {/* Show select only if enabled */}
                {model.enable && (
                  <Select defaultValue={aiSelectedModels[model.model].modelId} onValueChange={(value)=>{
                    onSelectValue(model.model, value)
                    
                  }}
                  disabled={model.premium}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={aiSelectedModels[model.model].modelId} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* FREE SECTION */}
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

                      {/* PREMIUM SECTION — show only if it exists */}
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
                                  disabled={subModel.premium}
                                >
                                  {subModel.name}{" "}
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

            {/* Premium Lock Notice */}
            {model.premium && model.enable && (
              <div className="flex items-center justify-center h-full">
                <Button>
                  <Lock className="mr-2 w-4 h-4" /> Upgrade To Unlock
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AiMultiModel;
