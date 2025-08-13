"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export function ChequeDetailsDialog({ 
  methodePaiement, 
  cheque, 
  montant, 
  compte, 
  date,
  formatCurrency,
  formatDate,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Définir la couleur et le style du badge selon la méthode de paiement
  const getBadgeStyle = (methode) => {
    if (methode === "cheque") {
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer";
    } else if (methode === "espece") {
      return "bg-green-100 text-green-800 hover:bg-green-100";
    } else {
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <>
      <Badge
        variant="secondary"
        className={`text-xs ${getBadgeStyle(methodePaiement)}`}
        onClick={methodePaiement === "cheque" ? () => setIsOpen(true) : undefined}
      >
        {methodePaiement === "espece" ? "Espèce" : methodePaiement === "cheque" ? "Chèque" : methodePaiement}
      </Badge>
      
      {methodePaiement === "cheque" && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Détails du Chèque
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2 text-sm">            
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numéro de chèque:</span>
                  <span className="font-medium">{cheque?.numero || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de règlement:</span>
                  <span className="font-medium">
                    {cheque?.dateReglement ? formatDate(cheque.dateReglement) : formatDate(date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-medium">{formatCurrency(montant)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compte bancaire:</span>
                  <span className="font-medium">{compte?.replace("compte ", "")}</span>
                </div>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 