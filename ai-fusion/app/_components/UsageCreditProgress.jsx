"use client";
import { Progress } from "@/components/ui/progress";
import React from "react";

function UsageCreditProgress({ remainingToken }) {
  const used = 10 - (remainingToken ?? 0);
  const progress = (used / 10) * 100;

  return (
    <div className="border rounded-2xl mb-5 p-3 flex flex-col gap-2">
      <h2 className="font-bold text-xl">Free Plan</h2>
      <p className="text-gray-500">{used}/10 messages used</p>
      <Progress value={progress} />
    </div>
  );
}

export default UsageCreditProgress;
