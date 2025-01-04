"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    categorie: "all",
    status: "all",
    prixAchat: [0, 10000],
    prixVente: [0, 10000],
    stock: [0, 1000],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
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

  const getProducts = async () => {
    const result = await axios.get("/api/produits");
    const { produits } = result.data;
    setProducts(produits);
    setIsLoading(false);
  };

  const deleteProduct = async () => {
    try {
      const result = await axios.delete(`/api/produits/${currProduct.id}`);
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

  const handleEdit = (id) => {
    console.log("Edit product:", id);
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      console.log("Deleting product:", productToDelete);
      // Actual delete logic here
    }
  };

  const handleDetails = (id) => {
    console.log("View details for product:", id);
  };

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
                  className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900"
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right text-black">
                      Statut
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="En stock">En stock</SelectItem>
                        <SelectItem value="Rupture">Rupture</SelectItem>
                        <SelectItem value="Commander">Commander</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="prixAchat"
                      className="text-right text-black"
                    >
                      Prix d'achat
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        value={filters.prixAchat}
                        onValueChange={(value) =>
                          setFilters({ ...filters, prixAchat: value })
                        }
                        className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.prixAchat[0]} DH</span>
                        <span>{filters.prixAchat[1]} DH</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="prixVente"
                      className="text-right text-black"
                    >
                      Prix de vente
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        min={0}
                        max={1500}
                        step={10}
                        value={filters.prixVente}
                        onValueChange={(value) =>
                          setFilters({ ...filters, prixVente: value })
                        }
                        className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.prixVente[0]} DH</span>
                        <span>{filters.prixVente[1]} DH</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right text-black">
                      Stock
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={filters.stock}
                        onValueChange={(value) =>
                          setFilters({ ...filters, stock: value })
                        }
                        className="w-full [&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-500 [&_[role=slider]]:focus:ring-purple-500 [&_[role=track]]:bg-purple-100 [&_[role=range]]:bg-purple-300"
                      />
                      <div className="flex justify-between mt-2">
                        <span>{filters.stock[0]}</span>
                        <span>{filters.stock[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <ProductFormDialog getProducts={getProducts}>
              <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
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
                <TableHead>Prix d'achat</TableHead>
                <TableHead>Prix de vente</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, index) => (
                  <TableRow
                    className="h-[2rem] MuiTableRow-root"
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={index}
                  >
                    <TableCell
                      className="!py-2 text-sm md:text-base"
                      key={index}
                      align="left"
                    >
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[100px]" />
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
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
