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
import { Plus, Search, Pen, Trash2, Info, Filter } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ModifyProductDialog } from "@/components/modify-product-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceRangeSlider } from "@/components/customUi/customSlider";


export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [max, setMax] = useState({
    prixAchat : "",
    prixVente : 0,
    stock : 0,
  });
  const [filters, setFilters] = useState({
    categorie: "all",
    status: "all",
    prixAchat: [0, max.prixAchat],
    prixVente: [0, max.prixVente],
    stock: [0, max.stock],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [products, setProducts] = useState(null);
  const [currProduct, setCurrProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  const itemsPerPage = 10;

  const filteredProducts = products?.filter(
    (product) =>
      (searchQuery === "" ||
        product.designation
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      (filters.categorie === "all" ||
        product.categorie === filters.categorie) &&
      (filters.status === "all" || product.statut === filters.status) &&
      product.prixAchat >= filters.prixAchat[0] &&
      product.prixAchat <= filters.prixAchat[1] &&
      product.prixVente >= filters.prixVente[0] &&
      product.prixVente <= filters.prixVente[1] &&
      product.stock >= filters.stock[0] &&
      product.stock <= filters.stock[1]
  );

  const totalPages = Math.ceil(filteredProducts?.length / itemsPerPage);
  const currentProducts = filteredProducts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  useEffect(() => {
    setFilters({ ...filters, 
      prixAchat: [0, max.prixAchat],
      prixVente: [0, max.prixVente],
      stock: [0, max.stock],
     });
  }, [max]);

  const getProducts = async () => {
    const result = await axios.get("/api/produits");
    const { produits } = result.data;
    setProducts(produits);
    const prixAchatList = produits.map((produit) => produit.prixAchat); 
    const prixVenteList = produits.map((produit) => produit.prixVente);
    const stockList = produits.map((produit) => produit.stock);
    setMax({...max , 
      prixAchat : Math.max(...prixAchatList), 
      prixVente : Math.max(...prixVenteList), 
      stock : Math.max(...stockList)});
    setIsLoading(false)
  };

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

      getProducts();
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    getProducts();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case "En stock":
        return "bg-emerald-500";
      case "En rupture":
        return "bg-red-500";
      case "Commander":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDetails = (id) => {
    console.log("View details for product:", id);
  };
  const status = [
    { value: "all", lable: "Tous les statut", color: "" },
    { value: "En stock", lable: "En stock", color: "green-500" },
    { value: "En rupture", lable: "En rupture", color: "red-500" },
    { value: "Commander", lable: "Commander", color: "amber-500" },
  ];

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
            />
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
                      <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">
                          Toutes les catégories
                        </SelectItem>
                        <SelectItem value="Électronique">
                          Électronique
                        </SelectItem>
                        <SelectItem value="Vêtements">Vêtements</SelectItem>
                        <SelectItem value="Alimentation">
                          Alimentation
                        </SelectItem>
                        <SelectItem value="Bureautique">Bureautique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4 my-2">
                    <Label htmlFor="statut" className="text-right text-black">
                      Statut
                    </Label>
                    <Select
                      value={filters.status}
                      name="statut"
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
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
                        max={max.prixAchat}
                        step={100}
                        value={filters.prixAchat} 
                        onValueChange={
                          (value) => setFilters({ ...filters, prixAchat: value }) 
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
                        max={max.prixVente}
                        step={100}
                        value={filters.prixVente} 
                        onValueChange={
                          (value) => setFilters({ ...filters, prixVente: value }) 
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
                        max={max.stock}
                        step={10}
                        value={filters.stock} 
                        onValueChange={
                          (value) => setFilters({ ...filters, stock: value }) 
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

            <ProductFormDialog getProducts={getProducts}>
              <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Produit
              </Button>
            </ProductFormDialog>
          </div>
        </div>

        <div className="border rounded-lg">
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
              {isLoading ? (
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
              ) : currentProducts?.length > 0 ? (
                currentProducts?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.designation}
                    </TableCell>
                    <TableCell>{product.categorie}</TableCell>
                    <TableCell>{product.prixAchat.toFixed(2)} DH</TableCell>
                    <TableCell>{product.prixVente.toFixed(2)} DH</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getStatusColor(
                            product.statut
                          )}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {product.statut}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <CustomTooltip message={product.description}>
                        {product.description && (
                          <span className="cursor-default">
                            {product.description.slice(0, 10)}...
                          </span>
                        )}
                      </CustomTooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ModifyProductDialog
                          getProducts={getProducts}
                          currProduct={currProduct}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() => setCurrProduct(product)}
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </ModifyProductDialog>

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
                          className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                          onClick={() => handleDetails(product.id)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Détails</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableCell colSpan={7} align="center">
                  Aucun produit trouvé
                </TableCell>
              )}
            </TableBody>
          </Table>
        </div>
        {filteredProducts?.length > 0 ? (
          <CustomPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        ) : (
          ""
        )}

        <DeleteConfirmationDialog
          recordName={currProduct?.designation}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            setDeleteDialogOpen(false);
            deleteProduct();
          }}
          itemType="produit"
        />
      </div>
    </>
  );
}
