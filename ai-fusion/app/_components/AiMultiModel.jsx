"use client";
import AiModelList from "@/shared/AiModelList";
import Image from "next/image";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function AiMultiModel() {
  const [aiModelList, setAiModelList] = useState(AiModelList);

  return (
    <div
      className="flex flex-row overflow-x-auto no-scrollbar gap-4 mt-2 h-[70vh] p-4"
    >
      {aiModelList.map((model, index) => (
        <div
          key={index}
          className="flex flex-col border rounded-2xl shadow-md bg-card/20 
                     hover:bg-card/30 transition-all duration-200
                     min-w-[400px] max-w-[420px] h-full p-4"
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
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={model.subModel[0].name} />
                </SelectTrigger>
                <SelectContent>
                  {model.subModel.map((subModel, i) => (
                    <SelectItem key={i} value={subModel.name}>
                      {subModel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Switch />
          </div>

        
        </div>
      ))}
    </div>
  );
}

export default AiMultiModel;
