"use client";

import {
  addCategorieProduits,
  deleteCategorieProduits,
} from "@/app/api/actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { ChangeEvent, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Categorie = {
  categorie: string;
  id: string;
};

export default function CategoriesProduits() {
  const [value, setValue] = useState<string>(""); //Inpute value
  const [categorie, setCategorie] = useState<Categorie | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);

  const getCategories = async () => {
    const response = await axios.get("/api/categoriesProduits");
    const categories = response.data.categories;
    console.log("categories : ", categories);
    return categories;
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const addCategorie = useMutation({
    mutationFn: async (categorie: string) => {
      const loadingToast = toast.loading("Ajout de la categorie...");
      try {
        await addCategorieProduits(categorie);
        toast.success("Categorie ajouter avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteCategorie = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la catégorie...");
      try {
        await deleteCategorieProduits(categorie?.id);
        toast(
          <span>
            La catégorie <b>{categorie?.categorie.toUpperCase()}</b> a été
            supprimé avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error) {
        toast.error("Échec de la suppression de la catégorie");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen">
        {/* Navbar - prend toute la largeur */}
        <Navbar />

        {/* Container principal avec sidebar et contenu */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Page content */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">
                    Catégories des produits
                  </h1>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"categories"} />
                  </div>

                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        addCategorie.mutate(value);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row gap-3 w-full mb-5">
                        <Input
                          placeholder="Catégorie ..."
                          value={value}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setValue(e.target.value)
                          }
                          className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                          spellCheck={false}
                        />
                        <Button
                          className="bg-emerald-400 hover:bg-emerald-500 rounded-full"
                          disabled={value === ""}
                          type="submit"
                        >
                          Ajouter
                        </Button>
                      </div>
                    </form>

                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Catégories</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {query.isLoading ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center">
                                Loading ...
                              </TableCell>
                            </TableRow>
                          ) : query.data?.length > 0 ? (
                            query.data?.map((categorie: Categorie) => (
                              <TableRow key={categorie.id}>
                                <TableCell className="font-medium">
                                  {categorie.categorie}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => {
                                        setCategorie(categorie);
                                        setDeleteDialog(true);
                                      }}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Supprimer</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center">
                                Aucune catégorie trouvée
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={categorie?.categorie}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteCategorie.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
