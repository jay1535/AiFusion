"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PricingTable } from "@clerk/clerk-react";

function PricingModel({ children }) {
  return (
    <Dialog>
      {/* ✅ Use asChild to avoid nested button issue */}
      <DialogTrigger asChild className="w-full">
        {children}
      </DialogTrigger>

      <DialogContent className={'min-w-4xl'}>
        <DialogHeader>
          <DialogTitle>Upgrade Plan</DialogTitle>
        </DialogHeader>

        {/* ✅ Avoid nesting div inside p */}
        <div className="mt-2">
          <PricingTable />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModel;
