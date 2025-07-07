"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomTooltip from "@/components/customUi/customTooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AchatCommandeForm } from "@/components/achat-commande-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/customUi/customPagination";
import {
  Plus,
  Search,
  Pen,
  Trash2,
  Filter,
  X,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { ProductFormDialog } from "@/components/product-form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ModifyProductDialog } from "@/components/modify-product-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceRangeSlider } from "@/components/customUi/customSlider";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { LoadingDots } from "@/components/loading-dots";
import ImportProduits from "@/components/importer-produits";

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState();
  const [totalPages, setTotalPages] = useState();
  const [maxPrixAchat, setMaxPrixAchat] = useState();
  const [maxPrixVente, setMaxPrixVente] = useState();
  const [currProduct, setCurrProduct] = useState(null);
  const [filters, setFilters] = useState({
    categorie: "all",
    statut: "all",
    prixAchat: [0, maxPrixAchat],
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
  const produits = useQuery({
    queryKey: [
      "produits",
      filters.statut,
      debouncedQuery,
      page,
      filters.categorie,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/produits", {
        params: {
          query: debouncedQuery,
          page,
          statut: filters.statut,
          categorie: filters.categorie,
          minPrixAchats: filters.prixAchat[0],
          maxPrixAchats: filters.prixAchat[1],
        },
      });
      setTotalPages(response.data.totalPages);
      setMaxPrixAchat(response.data.maxPrixAchat);
      setMaxPrixVente(response.data.maxPrixVente);

      //  console.log("### produits ###:", response.data.produits);

      return response.data;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  const deleteProduct = async () => {
    try {
      await axios.delete(`/api/produits/${currProduct.id}`);
      toast(
        <span>
          Le produit <b>{currProduct?.designation.toUpperCase()}</b> a été
          supprimé avec succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      queryClient.invalidateQueries(["produits"]);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,

      prixAchat: [0, maxPrixAchat],
    }));
  }, [maxPrixAchat, maxPrixVente]);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Produits</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {produits.isFetching && !produits.isLoading && <LoadingDots />}
            </div>
          </div>
          <div className="flex space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent className="border-l-purple-200 bg-white">
                <SheetHeader>
                  <SheetTitle className="text-black">Filtres</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    Ajustez les filtres pour affiner votre recherche de
                    produits.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="categorie"
                      className="text-right text-black"
                    >
                      Catégorie
                    </Label>
                    <Select
                      value={filters.categorie}
                      onValueChange={(value) =>
                        setFilters({ ...filters, categorie: value })
                      }
                    >
                      <SelectTrigger className="col-span-3  bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem key="all" value="all">
                          Toutes les catégories
                        </SelectItem>
                        {categories.data?.map((element) => (
                          <SelectItem
                            key={element.id}
                            value={element.categorie}
                          >
                            {element.categorie}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="montant" className="text-right text-black">
                      Prix:
                    </Label>
                    <div className="col-span-3">
                      <PriceRangeSlider
                        min={0}
                        max={maxPrixAchat}
                        step={100}
                        value={filters.prixAchat}
                        onValueChange={(value) =>
                          setFilters({ ...filters, prixAchat: value })
                        }
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.prixAchat[0]} DH</span>
                        <span>{filters.prixAchat[1]} DH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <ImportProduits>
              <Button
                variant="outline"
                className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </ImportProduits>
            <ProductFormDialog />
          </div>
        </div>

        <div className="col-span-2 mb-10">
          <div className="grid  gap-3 border mb-5 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réference</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Unite</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produits.isLoading ? (
                  [...Array(10)].map((_, index) => (
                    <TableRow
                      className="h-[2rem] MuiTableRow-root"
                      role="checkbox"
                      tabIndex={-1}
                      key={index}
                    >
                      <TableCell
                        className="!py-2 text-sm md:text-base"
                        align="left"
                      >
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[90px]" />
                      </TableCell>
                      <TableCell className="!py-2" align="left">
                        <Skeleton className="h-4 w-[90px]" />
                      </TableCell>
                      <TableCell className="!py-2">
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : produits.data?.produits.length > 0 ? (
                  produits.data?.produits.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium !py-2">
                        {product.reference}
                      </TableCell>
                      <TableCell className="font-medium !py-2">
                        {product.designation}
                      </TableCell>
                      <TableCell className="!py-2">
                        {product.categorie}
                      </TableCell>
                      <TableCell className="!py-2">
                        {product.prixAchat.toFixed(2)} DH
                      </TableCell>
                      <TableCell className="!py-2">{product.Unite}</TableCell>
                      <TableCell className="text-right !py-2">
                        <div className="flex justify-end gap-2">
                          <ModifyProductDialog currProduct={product} />

                          <CustomTooltip message="Supprimer">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                              onClick={() => {
                                setDeleteDialogOpen(true);
                                setCurrProduct(product);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CustomTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <div className="text-center py-10 text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-14 mx-auto mb-4 opacity-50"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                          />
                        </svg>
                        <p>Aucun produit trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {produits.data?.produits.length > 0 && (
            <CustomPagination
              currentPage={page}
              setCurrentPage={setPage}
              totalPages={totalPages}
            />
          )}
        </div>

        <DeleteConfirmationDialog
          recordName={currProduct?.designation}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            setDeleteDialogOpen(false);
            deleteProduct();
          }}
        />
      </div>
    </>
  );
}
