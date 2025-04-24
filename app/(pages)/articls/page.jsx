"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomTooltip from "@/components/customUi/customTooltip";
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
  X,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { LoadingDots } from "@/components/loading-dots";
import { ArticlForm } from "@/components/add-articl-form";
import { UpdateArticlForm } from "@/components/update-articl-form";

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [currArticl, setCurrArticl] = useState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState();
  const [debouncedValues, setDebouncedValues] = useState({
    stock: undefined,
    prixVente: undefined,
    prixAchat: undefined,
  });
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValues({
        stock: filters.stock,
        prixVente: filters.prixVente,
        prixAchat: filters.prixAchat,
      });
    }, 800);

    return () => clearTimeout(handler);
  }, [filters.stock, filters.prixVente, filters.prixAchat]);
  const queryClient = useQueryClient();
  const articls = useQuery({
    queryKey: [
      "articls",
      filters.statut,
      debouncedQuery,
      page,
      debouncedValues, // On utilise debouncedValues pour éviter d'envoyer plusieurs requêtes au serveur en même temps.
    ],
    queryFn: async () => {
      const response = await axios.get("/api/articls", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.articls;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  const deleteArticl = async () => {
    try {
      await axios.delete(`/api/articls/${currArticl.id}`);
      toast(
        <span>
          Le produit <b>{currArticl?.designation.toUpperCase()}</b> a été
          supprimé avec succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      queryClient.invalidateQueries(["articls"]);
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Articls</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Recherche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
            <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              {articls.isFetching && !articls.isLoading && <LoadingDots />}
            </div>
          </div>
          <div className="flex space-x-2">
            <ArticlForm />
            {/* <Sheet>
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
            </Sheet> */}
            {/* <ImportProduits>
            <Button
              variant="outline"
              className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            </ImportProduits> */}
            <Button
              onClick={() => {
                setAddDialogOpen(true);
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
                  Ajouter un articl
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articls.isLoading ? (
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
                        <TableCell className="!py-2">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : articls.data?.length > 0 ? (
                    articls.data?.map((articl) => (
                      <TableRow key={articl.id}>
                        <TableCell className="font-medium !py-2">
                          {articl.designation}
                        </TableCell>
                        <TableCell className="text-right !py-2">
                          <div className="flex justify-end gap-2">
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrArticl(articl);
                                  setUpdateDialogOpen(true)
                                  console.log("modifier un articl", articl);                
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
                                  setCurrArticl(articl);
                                  setDeleteDialogOpen(true)
                                  console.log("delete un articl", articl);                
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
                      <TableCell colSpan={7} align="center">
                        Aucun articl trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {articls.data?.length > 0 && (
              <CustomPagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
              />
            )}
          </div>
        </div>

        <DeleteConfirmationDialog
          recordName={currArticl?.designation}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            setDeleteDialogOpen(false);
            deleteArticl();
          }}
        />

        <ArticlForm
          isOpen={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onConfirm={() => {
            setAddDialogOpen(false);
          }}
        />
           <UpdateArticlForm
           articl={currArticl}
          isOpen={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
          onConfirm={() => {
            setUpdateDialogOpen(false);
          }}
        />
      </div>
    </>
  );
}
