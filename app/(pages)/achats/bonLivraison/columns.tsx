"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  numero: string;
  date: string;
  fournisseur: {
    nom: string;
  };
  total: number;
  totalPaye: number;
  reference: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "date",
    header: "Date",
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
    accessorKey: "total",
    header: () => <div className="text-left">Montant</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = `${new Intl.NumberFormat("fr-MA").format(amount)} MAD`;

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "totalPaye",
    header: () => <div className="text-left">Montant payé</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalPaye"));
      const formatted = `${new Intl.NumberFormat("fr-MA").format(amount)} MAD`;

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-end">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-right "
            >
              <span className="sr-only ">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Modifier</DropdownMenuItem>
            <DropdownMenuItem>Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
