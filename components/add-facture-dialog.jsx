"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArticleSelectionDialog } from "@/components/produits-selection-NouveauBL";
import { Badge } from "@/components/ui/badge";
import ComboBoxCommandesFournitures from "@/components/comboBox-commandesFournitures";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { AddButton } from "@/components/customUi/styledButton";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function FactureDialog({ devis, isOpen, onClose }) {
  const [date, setDate] = useState(null);
  const [numero, setNumero] = useState(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const createFacture = useMutation({
    mutationFn: async () => {
      const data = {
        date,
        devisId: devis.id,
        numero,
      };

      console.log("Facture data : ", data);
      const loadingToast = toast.loading("Opération en cours...");
      try {
        const response = await axios.post("/api/factures", data);
        toast.success("Opération éffectué avec succès");
        return response.data;
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["factures"]);
      router.push("/ventes/factures");
    },
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle>Créer une facture</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">Devis</Label>
                <Input
                  id="numero"
                  value={devis.numero}
                  className="col-span-3 focus:!ring-purple-500 "
                  spellCheck={false}
                />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">Numéro</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => {
                    setNumero(e.target.value);
                  }}
                  className="col-span-3 focus:!ring-purple-500 "
                  spellCheck={false}
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="client">Date : </Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex  gap-2">
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  createFacture.mutate();
                  onClose();
                }}
              >
                Créer la facture
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
