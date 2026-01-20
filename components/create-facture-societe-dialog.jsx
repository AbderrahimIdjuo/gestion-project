"use client";

import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CreatefactureAchatsDialog({
  reglement,
  open,
  onOpenChange,
}) {
  const [date, setDate] = useState(null);
  const [numero, setNumero] = useState(null);
  const [montant, setMontant] = useState("");
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setDate(new Date());
      setNumero(null);
      setMontant("");
      if (reglement) {
        setSelectedFournisseur(reglement.fournisseur);
      } else {
        setSelectedFournisseur(null);
      }
    }
  }, [open, reglement]);

  const createFacture = useMutation({
    mutationFn: async () => {
      const fournisseurId =
        selectedFournisseur?.id || reglement?.fournisseur?.id;
      if (!fournisseurId) {
        throw new Error("Fournisseur non trouvé");
      }

      if (!montant || montant === "") {
        throw new Error("Le montant est requis");
      }

      const totalMontant = parseFloat(montant);

      const data = {
        date: date || new Date(),
        numero,
        produits: [],
        total: totalMontant,
        fournisseurId: fournisseurId,
        reglementId: reglement?.id || null,
      };

      const loadingToast = toast.loading("Création de la facture...");
      try {
        const response = await axios.post("/api/facturesAchats", data);
        toast.success("Facture créée avec succès");
        return response.data;
      } catch (error) {
        toast.error("Échec de la création de la facture!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      queryClient.invalidateQueries({ queryKey: ["FacturesAchats"] });
      // Invalider aussi les notifications de prélèvements
      queryClient.invalidateQueries({ queryKey: ["today-prelevements"] });
      onOpenChange(false);
      resetDialog();
    },
  });

  const resetDialog = () => {
    setDate(null);
    setNumero(null);
    setMontant("");
    setSelectedFournisseur(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={open => {
          onOpenChange(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une facture</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              {!reglement ? (
                <div className="w-full space-y-2 col-span-1">
                  <ComboBoxFournisseur
                    fournisseur={selectedFournisseur}
                    setFournisseur={setSelectedFournisseur}
                  />
                  {reglement && (
                    <div className="w-full space-y-2 col-span-1">
                      <Label className="text-sm font-medium block pt-1">
                        Fournisseur sélectionné
                      </Label>
                      <Card className="h-10 flex items-center border border-gray-200">
                        <CardContent className="p-0 px-3 w-full">
                          <div className="flex items-center h-10">
                            <span className="text-sm font-medium">
                              {selectedFournisseur.nom}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full space-y-2 col-span-1">
                  <Label className="text-sm font-medium block pt-1">
                    Fournisseur
                  </Label>
                  <Card className="h-10 flex items-center border border-gray-200">
                    <CardContent className="p-0 px-3 w-full">
                      <div className="flex items-center h-10">
                        <span className="text-sm font-medium">
                          {selectedFournisseur?.nom ||
                            reglement?.fournisseur?.nom ||
                            "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="w-full space-y-2">
                <Label htmlFor="date">Date : </Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">Numéro</Label>
                <Input
                  id="numero"
                  value={numero || ""}
                  onChange={e => {
                    setNumero(e.target.value);
                  }}
                  className="focus:!ring-purple-500"
                  spellCheck={false}
                  placeholder="Numéro de facture"
                />
              </div>

              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">
                  Montant
                </Label>
                <div className="relative">
                  <Input
                    id="montant"
                    type="number"
                    min={0}
                    step="0.01"
                    value={montant}
                    onChange={e => {
                      setMontant(e.target.value);
                    }}
                    className="focus:!ring-purple-500 pr-12"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                    <span className="text-sm text-gray-600">MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  const fournisseurId =
                    selectedFournisseur?.id || reglement?.fournisseur?.id;
                  if (!fournisseurId) {
                    toast.error("Veuillez sélectionner un fournisseur");
                    return;
                  }
                  if (!montant || montant === "") {
                    toast.error("Veuillez saisir un montant");
                    return;
                  }
                  if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
                    toast.error("Le montant doit être un nombre positif");
                    return;
                  }
                  createFacture.mutate();
                }}
                disabled={
                  createFacture.isPending ||
                  !numero ||
                  numero.trim() === "" ||
                  !montant ||
                  montant.trim() === "" ||
                  isNaN(parseFloat(montant)) ||
                  parseFloat(montant) <= 0
                }
              >
                {createFacture.isPending ? "En cours..." : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
