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
import { ArrowRightLeft } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function warehouseQty(product, entrepotId) {
  if (!entrepotId) return 0;
  const row = product?.stocksEntrepot?.find(s => s.entrepotId === entrepotId);
  return Number(row?.quantite ?? 0);
}

export function TransfertStockDialog({
  product,
  open,
  onOpenChange,
}) {
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [quantite, setQuantite] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      const firstWithStock = product?.stocksEntrepot?.find(
        s => Number(s.quantite) > 0
      );
      setSourceId(firstWithStock?.entrepotId || "");
      setDestId("");
      setQuantite("");
    }
  }, [open, product]);

  const available = warehouseQty(product, sourceId);

  const transfert = useMutation({
    mutationFn: async () => {
      const q = parseFloat(String(quantite).replace(",", "."));
      const loadingToast = toast.loading("Transfert en cours...");
      try {
        await axios.post("/api/produits/transfert", {
          produitId: product.id,
          entrepotSourceId: sourceId,
          entrepotDestId: destId,
          quantite: q,
        });
        toast.success("Transfert effectué");
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Échec du transfert"
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
  const canSubmit =
    sourceId &&
    destId &&
    sourceId !== destId &&
    qNum > 0 &&
    qNum <= available &&
    !transfert.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transférer le stock
          </DialogTitle>
          <DialogDescription>
            {product?.designation
              ? `Déplacer « ${product.designation} » d'un entrepôt à un autre.`
              : "Déplacer un produit d'un entrepôt à un autre."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <EntrepotSelect
            label="Entrepôt source"
            value={sourceId}
            onValueChange={setSourceId}
            placeholder="Source…"
          />
          {sourceId && (
            <p className="text-xs text-muted-foreground -mt-2">
              Disponible :{" "}
              {available.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </p>
          )}
          <EntrepotSelect
            label="Entrepôt destination"
            value={destId}
            onValueChange={setDestId}
            placeholder="Destination…"
          />
          <div className="space-y-2">
            <Label>Quantité</Label>
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
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange?.(false)}
            disabled={transfert.isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="rounded-full bg-amber-600 hover:bg-amber-700 text-white"
            disabled={!canSubmit}
            onClick={() => transfert.mutate()}
          >
            {transfert.isLoading ? "En cours…" : "Transférer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
