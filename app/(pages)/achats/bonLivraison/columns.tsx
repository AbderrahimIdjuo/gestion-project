"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/functions";
import { ColumnDef } from "@tanstack/react-table";
import {
  CircleDollarSign,
  Eye,
  MoreVertical,
  Pen,
  Printer,
  Trash2,
} from "lucide-react";

export type BonLivraisonT = {
  id: string;
  numero: string;
  date: string;
  fournisseur: string;
  total: number;
  totalPaye: number;
  reference: string;
  statutPaiement?: string | null;
  transactions: {
    date: string;
    montant: number;
    methodePaiement: string;
    compte: string;
  }[];
};

const getMethodePaiement = (methode: string, compte: string) => {
  if (
    methode === "espece" &&
    (compte === "compte personnel" || compte === "compte professionel")
  ) {
    return "Versement";
  } else if (methode === "espece") {
    return "Espèce";
  } else if (methode === "cheque") {
    return "Chèque";
  }
};
export function useBonLivraisonColumns({
  setCurrentBL,
  setPreviewDialogOpen,
  setDeleteDialogOpen,
  setUpdateDialogOpen,
  setPaiementDialogOpen,
  isAdmin = false,
}: {
  setCurrentBL: (bl: BonLivraisonT) => void;
  setPreviewDialogOpen: (val: boolean) => void;
  setDeleteDialogOpen: (val: boolean) => void;
  setUpdateDialogOpen: (val: boolean) => void;
  setPaiementDialogOpen: (val: boolean) => void;
  isAdmin?: boolean;
}) {
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
      accessorKey: "statutPaiement",
      header: "Statut Paiement",
      cell: ({ row }) => {
        const statutPaiement = row.getValue("statutPaiement") as string | null;
        let colorClass = "bg-gray-200 text-gray-700";
        let label = "Indéterminé";
        if (statutPaiement === "enPartie") {
          colorClass = "bg-amber-100 text-amber-700";
          label = "En partie";
        } else if (statutPaiement === "paye") {
          colorClass = "bg-green-100 text-green-700";
          label = "Payé";
        } else if (statutPaiement === "impaye") {
          colorClass = "bg-red-100 text-red-700";
          label = "Impayé";
        }

        return (
          <div>
            <span
              className={`w-32 ml-2 px-2 py-1 rounded-full text-xs font-semibold uppercase ${colorClass}`}
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
            className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${colorClass}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Montant</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"));
        return (
          <div className="text-right font-medium">{formatCurrency(amount)}</div>
        );
      },
    },
    {
      accessorKey: "totalPaye",
      header: () => <div className="text-right">Montant payé</div>,
      cell: ({ row }) => {
        const bonLivraison = row.original;
        const amount = parseFloat(row.getValue("totalPaye"));
        const formatted = formatCurrency(amount);

        // Si pas de transactions, afficher juste le montant
        if (!bonLivraison.transactions?.length) {
          return (
            <div className="w-full text-right font-medium">{formatted}</div>
          );
        }

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-end text-right font-medium p-0 h-auto hover:text-purple-500"
              >
                {formatted}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" side="right">
              <div className="space-y-3">
                {/* Header */}
                <div className="border-b pb-2">
                  <h4 className="font-semibold text-sm text-gray-900">
                    Détails des paiements
                  </h4>
                  <p className="text-sm text-gray-500">{bonLivraison.numero}</p>
                </div>

                {/* Transactions */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {bonLivraison.transactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex flex-col p-3 bg-gray-50 rounded-md border"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {formatCurrency(transaction.montant)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="bg-purple-100 text-violet-700 px-2 py-1 rounded text-xs font-medium">
                          {getMethodePaiement(
                            transaction.methodePaiement,
                            transaction.compte
                          )}
                        </span>
                        <span className="text-md">{transaction.compte}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer total */}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">
                      Total payé:
                    </span>
                    <span className="font-bold text-gray-700">{formatted}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
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
                    <MoreVertical className="h-4 w-4" />
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
                {isAdmin && (
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
                )}
                <DropdownMenuItem
                  onClick={() => {
                    console.log("bonLivraison", bonLivraison);

                    setCurrentBL(bonLivraison);
                    setPreviewDialogOpen(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-blue-100"
                >
                  <Eye className="h-4 w-4 text-sky-600" />

                  <span className="transition-colors duration-200 group-hover:text-blue-600 group-hover:bg-blue-100">
                    Aperçu
                  </span>
                </DropdownMenuItem>
                {bonLivraison.statutPaiement !== "paye" && (
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("bonLivraison", bonLivraison);
                      setCurrentBL(bonLivraison);
                      setPaiementDialogOpen(true);
                    }}
                    className="flex items-center gap-2 cursor-pointer group hover:!bg-green-100"
                  >
                    <CircleDollarSign className="h-4 w-4 text-green-600" />

                    <span className="transition-colors duration-200 group-hover:text-green-600 group-hover:bg-green-100">
                      paiement
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    window.open(`/achats/bonLivraison/imprimer`, "_blank");
                    localStorage.setItem(
                      "bonLivraison",
                      JSON.stringify(bonLivraison)
                    );
                  }}
                  className="flex items-center gap-2 cursor-pointer group hover:!bg-fuchsia-100"
                >
                  <Printer className="h-4 w-4 text-fuchsia-600" />

                  <span className="transition-colors duration-200 group-hover:text-fuchsia-600 group-hover:bg-fuchsia-100">
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
