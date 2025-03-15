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

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState();
  const [totalPages, setTotalPages] = useState();
  const [maxPrixAchat, setMaxPrixAchat] = useState();
  const [maxPrixVente, setMaxPrixVente] = useState();
  const [maxStock, setMaxStock] = useState();
  const [currProduct, setCurrProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isPurchasingProduct, setIsPurchasingProduct] = useState(false);

  const [filters, setFilters] = useState({
    categorie: "all",
    statut: "all",
    prixAchat: [0, maxPrixAchat],
    prixVente: [0, maxPrixVente],
    stock: [0, maxStock],
  });

  const stockStatuts = (stock) => {
    if (stock > 19) {
      return "En stock";
    } else if (stock < 20 && stock > 0) {
      return "Limité";
    } else if (stock == 0) {
      return "En rupture";
    }
  };
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
      filters.prixAchat,
      filters.prixVente,
      filters.stock,
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
          minPrixVentes: filters.prixVente[0],
          maxPrixVentes: filters.prixVente[1],
        },
      });
      setTotalPages(response.data.totalPages);
      setMaxPrixAchat(response.data.maxPrixAchat);
      setMaxPrixVente(response.data.maxPrixVente);
      setMaxStock(response.data.maxStock);
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
      stock: [0, maxStock],
      prixAchat: [0, maxPrixAchat],
      prixVente: [0, maxPrixVente],
    }));
  }, [maxStock, maxPrixAchat, maxPrixVente]);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "En stock":
        return "bg-emerald-500";
      case "En rupture":
        return "bg-red-500";
      case "Limité":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const status = [
    { value: "all", lable: "Tous les statut", color: "" },
    { value: "En stock", lable: "En stock", color: "green-500" },
    { value: "En rupture", lable: "En rupture", color: "red-500" },
    { value: "Limité", lable: "Limité", color: "amber-500" },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 mb-[5rem]">
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
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut
                    </Label>
                    <Select
                      value={filters.statut}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, statut: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Séléctionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {status.map((statut, index) => (
                          <SelectItem key={index} value={statut.value}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full bg-${statut.color}`}
                              />
                              {statut.lable}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="montant" className="text-right text-black">
                      Prix d&apos;achat :
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
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="montant" className="text-right text-black">
                      Prix de vente :
                    </Label>
                    <div className="col-span-3">
                      <PriceRangeSlider
                        min={0}
                        max={maxPrixVente}
                        step={100}
                        value={filters.prixVente}
                        onValueChange={(value) =>
                          setFilters({ ...filters, prixVente: value })
                        }
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.prixVente[0]} DH</span>
                        <span>{filters.prixVente[1]} DH</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="montant" className="text-right text-black">
                      Stock :
                    </Label>
                    <div className="col-span-3">
                      <PriceRangeSlider
                        min={0}
                        max={maxStock}
                        step={10}
                        value={filters.stock}
                        onValueChange={(value) =>
                          setFilters({ ...filters, stock: value })
                        }
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.stock[0]} </span>
                        <span>{filters.stock[1]} </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              onClick={() => {
                setIsAddingProduct(!isAddingProduct);
                if (isUpdatingProduct || isPurchasingProduct) {
                  setIsUpdatingProduct(false);
                  setIsAddingProduct(false);
                  setIsPurchasingProduct(false);
                }
              }}
              className={`${
                isAddingProduct || isUpdatingProduct || isPurchasingProduct
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
              } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
            >
              {isAddingProduct || isUpdatingProduct || isPurchasingProduct ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className={`grid pb-5 ${
            isAddingProduct || isUpdatingProduct || isPurchasingProduct
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2 mb-10">
            <div
              className={`grid  gap-3 border mb-5 rounded-lg ${
                (isAddingProduct || isUpdatingProduct || isPurchasingProduct) &&
                "hidden"
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix d&apos;achat</TableHead>
                    <TableHead>Prix de vente</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Description</TableHead>
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
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[90px]" />
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
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : produits.data?.produits.length > 0 ? (
                    produits.data?.produits.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium !py-2">
                          {product.designation}
                        </TableCell>
                        <TableCell className="!py-2">{product.categorie}</TableCell>
                        <TableCell className="!py-2">{product.prixAchat.toFixed(2)} DH</TableCell>
                        <TableCell className="!py-2">{product.prixVente.toFixed(2)} DH</TableCell>
                        <TableCell className="!py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${getStatusColor(
                                stockStatuts(product.stock)
                              )}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {stockStatuts(product.stock)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="!py-2">{product.stock}</TableCell>
                        <TableCell className="!py-2">
                          <CustomTooltip message={product.description}>
                            {product.description && (
                              <span className="cursor-default">
                                {product.description.slice(0, 10)}
                              </span>
                            )}
                          </CustomTooltip>
                        </TableCell>
                        <TableCell className="text-right !py-2">
                          <div className="flex justify-end gap-2">
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrProduct(product);
                                  setIsUpdatingProduct(true);
                                  setIsAddingProduct(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
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
                            <CustomTooltip message="Commander">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                                onClick={() => {
                                  setCurrProduct(product);
                                  setIsPurchasingProduct(!isPurchasingProduct);
                                  setIsUpdatingProduct(false);
                                  setIsAddingProduct(false);
                                }}
                              >
                                <ShoppingBag className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table */}
            <div>
              <ScrollArea
                className={`w-full h-[80vh]  grid gap-3  border mb-3 rounded-lg ${
                  !isAddingProduct &&
                  !isUpdatingProduct &&
                  !isPurchasingProduct &&
                  "hidden"
                } `}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
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
                            <div className="flex gap-2 justify-end">
                              <Skeleton className="h-7 w-7 rounded-full" />
                              <Skeleton className="h-7 w-7 rounded-full" />
                              <Skeleton className="h-7 w-7 rounded-full" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : produits.data?.produits.length > 0 ? (
                      produits.data?.produits.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.designation}
                          </TableCell>
                          <TableCell>{product.categorie}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${getStatusColor(
                                  stockStatuts(product.stock)
                                )}`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {stockStatuts(product.stock)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrProduct(product);
                                  setIsUpdatingProduct(true);
                                  setIsAddingProduct(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Button>
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
                                <span className="sr-only">Supprimer</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                                onClick={() => {
                                  setCurrProduct(product);
                                  setIsPurchasingProduct(!isPurchasingProduct);
                                  setIsUpdatingProduct(false);
                                  setIsAddingProduct(false);
                                }}
                              >
                                <ShoppingBag className="h-4 w-4" />
                                <span className="sr-only">Détails</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Aucun produit trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            {produits.data?.produits.length > 0 && (
              <CustomPagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
              />
            )}
          </div>

          <div className={`${!isAddingProduct && "hidden"} `}>
            <ScrollArea className="w-full h-[85vh]">
              {isAddingProduct && (
                <ProductFormDialog  />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isUpdatingProduct && "hidden"} `}>
            <ScrollArea className="w-full h-[85vh]">
              {isUpdatingProduct && (
                <ModifyProductDialog
                  currProduct={currProduct}
                  
                />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isPurchasingProduct && "hidden"} `}>
            <ScrollArea className="w-full h-[85vh]">
              {isPurchasingProduct && (
                <AchatCommandeForm currProduct={currProduct} />
              )}
            </ScrollArea>
          </div>
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
