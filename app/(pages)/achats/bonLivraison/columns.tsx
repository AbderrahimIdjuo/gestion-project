"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pen,
  Trash2,
  CircleDollarSign,
  Eye,
  Printer,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import PaiementBLDialog from "@/components/paiement-BL";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useDeleteBonLivraison } from "@/hooks/useDeleteBonLivraison";
import PreviewBonLivraisonDialog from "@/components/preview-bonLivraison";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type BonLivraisonT = {
  id: string;
  numero: string;
  date: string;
  fournisseur: string;
  total: number;
  totalPaye: number;
  reference: string;
};

export function useBonLivraisonColumns() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [currentBL, setCurrentBL] = useState<BonLivraisonT>();
  const deleteDevi = useDeleteBonLivraison();

  const columns: ColumnDef<BonLivraisonT>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "numero",
      header: "Numéro",
    },
    {
      accessorKey: "reference",
      header: "Référence",
    },
    {
      accessorKey: "fournisseur",
      header: "Fournisseur",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string | null;

        let colorClass = "bg-gray-200 text-gray-700";
        let label = "Indéterminé";

        if (type === "achats") {
          colorClass = "bg-green-100 text-green-700";
          label = "Achats";
        } else if (type === "retour") {
          colorClass = "bg-red-100 text-red-700";
          label = "Retour";
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${colorClass}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Montant",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"));
        const formatted = `${new Intl.NumberFormat("fr-MA").format(
          amount
        )} MAD`;

        return <div className="text-left font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "totalPaye",
      header: "Montant payé",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalPaye"));
        const formatted = `${new Intl.NumberFormat("fr-MA").format(
          amount
        )} MAD`;

        return <div className="text-left font-medium">{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const bonLivraison = row.original;

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full text-right"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-md">
                <DropdownMenuItem
                  onClick={() =>
                    console.log("modifier un BL ", bonLivraison.id)
                  }
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-purple-100"
                >
                  <Pen className="h-4 w-4 text-purple-600" />
                  <span>Modifier</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentBL(bonLivraison);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-red-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>Supprimer</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentBL(bonLivraison);
                    setPreviewDialogOpen(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-blue-100"
                >
                  <Eye className="h-4 w-4 text-sky-600" />

                  <span className="transition-colors duration-200 group-hover:text-blue-600 group-hover:bg-blue-100">
                    Visualiser
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.open(`/achats/bonLivraison/imprimer`, "_blank");
                    localStorage.setItem(
                      "bonLivraison",
                      JSON.stringify(bonLivraison)
                    );
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-green-100"
                >
                  <Printer className="h-4 w-4 text-green-600" />

                  <span className="transition-colors duration-200 group-hover:text-green-600 group-hover:bg-green-100">
                    Imprimer
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentBL(bonLivraison);
                    setPaiementDialogOpen(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-green-100"
                >
                  <CircleDollarSign className="h-4 w-4 text-green-600" />

                  <span className="transition-colors duration-200 group-hover:text-green-600 group-hover:bg-green-100">
                    Paiement
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DeleteConfirmationDialog
              recordName={currentBL?.numero}
              isOpen={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                setDeleteDialogOpen(false);
                deleteDevi.mutate(currentBL);
              }}
            />
            <PreviewBonLivraisonDialog
              bonLivraison={currentBL}
              isOpen={previewDialogOpen}
              onClose={() => setPreviewDialogOpen(false)}
            />
            <PaiementBLDialog
              bonLivraison={currentBL}
              isOpen={paiementDialogOpen}
              onClose={() => setPaiementDialogOpen(false)}
            />
          </>
        );
      },
    },
  ];

  return columns;
}

