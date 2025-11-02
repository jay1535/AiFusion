"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PricingTable } from "@clerk/clerk-react";

function PricingModel({ children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-4xl">
        <DialogHeader>
          <DialogTitle>Upgrade Plan</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <PricingTable />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingModel;
