"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function PaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  compte,
  setCompte,
  setMontant,
}) {

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      console.log("comptes : ", comptes);
      return comptes;
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] caret-transparent">
        <DialogHeader>
          <DialogTitle>Choisir le montant et le compte à débiter</DialogTitle>
          <DialogDescription>
            Déterminer le montant et sélectionnez le compte que vous souhaitez
            utiliser pour ce paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full flex justify-center gap-3 items-center">
          <Label htmlFor="montant" className="text-left mb-2 mb-2">
            Montant :
          </Label>
          <div className="relative grid grid-cols-1 items-center gap-4">
            <Input
              id="montant"
              name="montant"
              className="col-span-3 focus-visible:ring-purple-500"
              onChange={(e) => setMontant(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
              <span className="text-sm text-gray-600">MAD</span>
            </div>
          </div>
        </div>
        <RadioGroup value={compte} onValueChange={setCompte}>
          {comptes?.data?.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-center gap-3 my-2"
            >
              <RadioGroupItem value={account.compte} id={account.id} />
              <Label
                htmlFor={account.id}
                className="flex flex-1 items-center justify-between cursor-pointer"
              >
                <span>{account.compte}</span>
                {/* <span className="text-sm text-muted-foreground">
                  1000.00 DH
                </span> */}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button
            className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
            onClick={() => {
              console.log(`Paiement effectué depuis le compte: ${compte}`);
              onConfirm();
              onClose();
            }}
            disabled={!compte}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
