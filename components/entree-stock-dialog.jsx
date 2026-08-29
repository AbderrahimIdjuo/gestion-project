"use client";

import { EntrepotSelect } from "@/components/entrepot-select";
import { Button } from "@/components/ui/button";
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
import { PackagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function warehouseQty(product, entrepotId) {
  if (!entrepotId) return 0;
  const row = product?.stocksEntrepot?.find(s => s.entrepotId === entrepotId);
  return Number(row?.quantite ?? 0);
}

export function EntreeStockDialog({ product, open, onOpenChange }) {
  const [entrepotId, setEntrepotId] = useState("");
  const [quantite, setQuantite] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setEntrepotId("");
      setQuantite("");
    }
  }, [open, product]);

  const current = warehouseQty(product, entrepotId);

  const entree = useMutation({
    mutationFn: async () => {
      const q = parseFloat(String(quantite).replace(",", "."));
      const loadingToast = toast.loading("Entrée en stock...");
      try {
        await axios.post("/api/produits/stock", {
          entrepotId,
          items: [{ produitId: product.id, quantite: q }],
        });
        toast.success("Stock mis à jour");
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Échec de l'entrée en stock"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produits"] });
      onOpenChange?.(false);
    },
  });

  const qNum = parseFloat(String(quantite).replace(",", ".")) || 0;
  const canSubmit = entrepotId && qNum > 0 && !entree.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Entrée en stock
          </DialogTitle>
          <DialogDescription>
            {product?.designation
              ? `Ajouter du stock pour « ${product.designation} ».`
              : "Ajouter du stock pour ce produit."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <EntrepotSelect
            label="Entrepôt"
            value={entrepotId}
            onValueChange={setEntrepotId}
            placeholder="Sélectionner un entrepôt…"
          />
          {entrepotId && (
            <p className="text-xs text-muted-foreground -mt-2">
              Stock actuel :{" "}
              {current.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </p>
          )}
          <div className="space-y-2">
            <Label>Quantité à ajouter</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
              className="focus-visible:ring-purple-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!canSubmit}
            onClick={() => entree.mutate()}
          >
            {entree.isLoading ? "En cours…" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
