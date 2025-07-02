"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Trash2,
  Printer,
  PrinterCheck,
  MoreVertical,
  CircleDollarSign,
  TruckIcon,
  Files,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PaiementDialog } from "@/components/paiement-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addtransaction } from "@/app/api/actions";
import toast from "react-hot-toast";
import FournitureDialog from "@/components/fourniture-dialog";
import FactureDialog from "@/components/add-facture-dialog";
export function DevisActions({
  devis,
  setDeleteDialogOpen,
  setCurrentDevi,
  transactions,
  bLGroups,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compte, setCompte] = useState("");
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isFournitureOpen, setIsFournitureOpen] = useState(false);
  const [isFactureOpen, setIsFactureOpen] = useState(false);

  const [montant, setMontant] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const transactionsDevis = (numero) => {
    const trans = transactions?.filter((c) => c.reference === numero);
    return trans;
  };
 

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-gray-200"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 rounded-md">
          <DropdownMenuItem
            onClick={() => router.push(`/ventes/devis/${devis.id}/update`)}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-purple-100"
          >
            <Pen className="h-4 w-4 text-purple-600 group-hover:text-purple-600" />
            <span className="transition-colors duration-200 group-hover:text-purple-600 group-hover:bg-purple-100">
              Modifier
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setCurrentDevi(devis);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-red-100"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            <span className="transition-colors duration-200 group-hover:text-red-600 group-hover:bg-red-100">
              Supprimer
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsBankDialogOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-blue-100"
          >
            <CircleDollarSign className="h-4 w-4 text-sky-600" />

            <span className="transition-colors duration-200 group-hover:text-blue-600 group-hover:bg-blue-100">
              paiement
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              window.open(`/ventes/devis/imprimerFournitures`, "_blank");
              localStorage.setItem("devi", JSON.stringify(devis));
              localStorage.setItem("bLGroups", JSON.stringify(bLGroups));
            }}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-fuchsia-100"
          >
            <TruckIcon className="h-4 w-4 text-fuchsia-600" />

            <span className="transition-colors duration-200 group-hover:text-fuchsia-600 group-hover:bg-fuchsia-100">
              Fourniture
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              window.open(`/ventes/devis/${devis.id}/pdf`, "_blank");
              localStorage.setItem("devi", JSON.stringify(devis));
            }}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-amber-100"
          >
            <Printer className="h-4 w-4 text-amber-600" />
            <span className="transition-colors duration-200 group-hover:text-amber-600 group-hover:bg-amber-100">
              Imprimer
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsFactureOpen(true);
              setMenuOpen(false);
              setCurrentDevi(devis);
            }}
            className="flex items-center gap-2 cursor-pointer group hover:!bg-emerald-100"
          >
            <Files className="h-4 w-4 text-emerald-600" />
            <span className="transition-colors duration-200 group-hover:text-emerald-600 group-hover:bg-emerald-100">
              créer une facture
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PaiementDialog
        devis={devis}
        transactions={transactionsDevis(devis.numero)}
        setCompte={setCompte}
        compte={compte}
        setMontant={setMontant}
        isOpen={isBankDialogOpen}
        onClose={() => setIsBankDialogOpen(false)}
        onConfirm={() => {
         // createTransaction.mutate();
          setIsBankDialogOpen(false);
        }}
      />
      <FournitureDialog
        devis={devis}
        isOpen={isFournitureOpen}
        onClose={() => setIsFournitureOpen(false)}
        bLGroups={bLGroups}
      />
      <FactureDialog
        devis={devis}
        isOpen={isFactureOpen}
        onClose={() => setIsFactureOpen(false)}
      />
    </>
  );
}
