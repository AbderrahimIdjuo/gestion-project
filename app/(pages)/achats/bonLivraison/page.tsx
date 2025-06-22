"use client";

import { useBonLivraisonColumns, BonLivraisonT } from "./columns";
import { DataTable } from "./data-table";
import { useEffect, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import { Label } from "@/components/ui/label";
import { LoadingDots } from "@/components/loading-dots";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Pen, Trash2, Filter, Printer } from "lucide-react";
import { UpdateAchatCommandeForm } from "@/components/update-achat-commande-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { AchatCommandesForm } from "@/components/achat-many-commande-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import AddBonLivraison from "@/components/add-bonLivraison";
import PreviewCommandeFournitureDialog from "@/components/preview-commandeFourniture";
import PrintCommandeFournitureDialog from "@/components/print-commandeFourniture";
import CustomTooltip from "@/components/customUi/customTooltip";

function formatDate(dateString: String) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export default function BonLivraison() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currCommande, setCurrCommande] = useState("");
  const [maxMontant, setMaxMontant] = useState<number | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [lastBonLivraison, setLastBonLivraison] = useState();
  const [filters, setFilters] = useState({
    categorie: "all",
    statut: "all",
    statutPaiement: "all",
    montant: [0, maxMontant],
  });
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const queryClient = useQueryClient();

  const {
    data: bonLivraison,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "bonLivraison",
      filters.statut,
      debouncedQuery,
      page,
      startDate,
      endDate,
      filters.montant,
      filters.categorie,
      filters.statutPaiement,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/bonLivraison", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          from: startDate,
          to: endDate,
          minTotal: filters.montant[0],
          maxTotal: filters.montant[1],
          categorie: decodeURIComponent(filters.categorie),
          statutPaiement: filters.statutPaiement,
        },
      });
      console.log(
        "Fetching bonLivraison with filters:",
        response.data.bonLivraison
      );
      setLastBonLivraison(response.data.lastBonLivraison);
      setTotalPages(response.data.totalPages);
      return response.data.bonLivraison;
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
  const listBonLivraison =
    bonLivraison?.map((bon: any) => ({
      id: bon.id,
      date: formatDate(bon.date),
      numero: bon.numero,
      type: bon.type,
      totalPaye: bon.totalPaye,
      reference: bon.reference,
      fournisseur: bon.fournisseur.nom,
      total: bon.total,
      produits: bon.produits,
    })) ?? [];

  return (
    <>
      <Toaster position="top-center" />
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des bon de livraison..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {isFetching && !isLoading && <LoadingDots />}
            </div>
          </div>
          <div className="flex gap-3">
            <AddBonLivraison lastBonLivraison={lastBonLivraison} />
          </div>
        </div>
        <DataTable columns={useBonLivraisonColumns()} data={listBonLivraison} />
      </div>
    </>
  );
}
