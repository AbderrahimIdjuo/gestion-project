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
import { CreditCard } from "lucide-react";

// Simuler une liste de comptes
const accounts = [
  { id: "1", name: "CIH BANK", balance: 1500 },
  { id: "2", name: "CHAABI BANK", balance: 5000 },
  { id: "3", name: "CAISSE", balance: 3000 },
];

export function PaymentDialog({ isOpen, onClose, onConfirm }) {
  const [selectedAccount, setSelectedAccount] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choisir le compte à débiter</DialogTitle>
          <DialogDescription>
            Sélectionnez le compte que vous souhaitez utiliser pour ce paiement.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={selectedAccount} onValueChange={setSelectedAccount}>
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-center gap-3 my-2"
            >
              <RadioGroupItem value={account.id} id={account.id} />
              <Label
                htmlFor={account.id}
                className="flex flex-1 items-center justify-between"
              >
                <span>{account.name}</span>
                <span className="text-sm text-muted-foreground">
                  {account.balance.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "MAD",
                  })}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button
            className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
            onClick={() => {
              console.log(
                `Paiement effectué depuis le compte: ${selectedAccount}`
              );
              onConfirm();
              onClose();
            }}
            disabled={!selectedAccount}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Confirmer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
