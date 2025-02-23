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
export type Commande = {
  id: string;
  statut: "En cours" | "Expédiée" | "Livrée" | "Annulée";
  date: Date;
  client: string;
  montant: number;
};

export const columns: ColumnDef<Commande>[] = [
  {
    accessorKey: "client",
    header: "Client",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "montant",
    header: "Montant",
  },
  {
    accessorKey: "statut",
    header: "Statut",
  },
//   {
//     accessorKey: "",
//     header: "Action",
//   },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >

              <MoreHorizontal className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
