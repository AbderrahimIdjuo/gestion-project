"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import SittingsSideBar from "@/components/sittingsSideBar";
import { addCompteBancaire } from "@/app/api/actions";
import { deleteCompteBancaire } from "@/app/api/actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

type Compte = {
  compte: string;
  id: string;
};

export default function banques() {
  const [value, setValue] = useState<string>(""); //Inpute value
  const [compte, setCompte] = useState<Compte | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);

  const getcomptes = async () => {
    const response = await axios.get("/api/comptesBancaires");
    const comptes = response.data.comptes;
    console.log("comptes : ", comptes);
    return comptes;
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["comptes"],
    queryFn: getcomptes,
  });
  console.log("data :", typeof query.data);

  const addcompte = useMutation({
    mutationFn: async (compte: string) => {
      const loadingToast = toast.loading("Ajout de la compte...");
      try {
        await addCompteBancaire(compte);
        toast.success("compte ajouter avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
    },
  });

  const deletecompte = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la catégorie...");
      try {
        await deleteCompteBancaire(compte?.id);
        toast(
          <span>
            <b>{compte?.compte.toUpperCase()}</b> est supprimé!
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
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Comptes Bancaires</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-start">
          <div className="hidden md:block">
            <SittingsSideBar page={"banques"} />
          </div>

          <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addcompte.mutate(value);
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3 w-full mb-5">
                <Input
                  placeholder="Compte..."
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
                    <TableHead className="text-right">Actions</TableHead>
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
                    query.data?.map((compte: Compte) => (
                      <TableRow key={compte.id}>
                        <TableCell className="font-medium">
                          {compte.compte}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setCompte(compte);
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
                        Aucun compte trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={compte?.compte}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deletecompte.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
