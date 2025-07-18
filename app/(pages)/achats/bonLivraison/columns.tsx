"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pen, Trash2, Eye, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BonLivraisonT = {
  id: string;
  numero: string;
  date: string;
  fournisseur: string;
  total: number;
  totalPaye: number;
  reference: string;
};

export function useBonLivraisonColumns({
  setCurrentBL,
  setPreviewDialogOpen,
  setDeleteDialogOpen,
  setUpdateDialogOpen,
}: {
  setCurrentBL: (bl: BonLivraisonT) => void;
  setPreviewDialogOpen: (val: boolean) => void;
  setDeleteDialogOpen: (val: boolean) => void;
  setUpdateDialogOpen: (val: boolean) => void;
}) {
  const columns: ColumnDef<BonLivraisonT>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "numero",
      header: "Numéro",
      cell: ({ row }) => {
        const numero = row.getValue("numero") as string | null;
        const total = parseFloat(row.getValue("total"));
        const totalPaye = parseFloat(row.getValue("totalPaye"));
        const rest = total - totalPaye;
        let colorClass = "bg-gray-200 text-gray-700";
        let label = "Indéterminé";
        if (rest > 0 && totalPaye > 0) {
          colorClass = "bg-amber-100 text-amber-700";
          label = "En partie";
        } else if (rest === 0 && totalPaye > 0) {
          colorClass = "bg-green-100 text-green-700";
          label = "Payé";
        } else if (rest > 0 && totalPaye === 0) {
          colorClass = "bg-red-100 text-red-700";
          label = "Impayé";
        }

        return (
          <div>
            {numero}
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold uppercase ${colorClass}`}
            >
              {label}
            </span>
          </div>
        );
      },
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
          colorClass = "bg-lime-100 text-lime-700";
          label = "Achats";
        } else if (type === "retour") {
          colorClass = "bg-rose-100 text-rose-700";
          label = "Retour";
        }

        return (
          <span
            className={`px-2 py-1 rounded-lg  text-xs font-semibold uppercase ${colorClass}`}
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
                  onClick={() => {
                    setUpdateDialogOpen(true);
                    setCurrentBL(bonLivraison);
                  }}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];

  return columns;
}
