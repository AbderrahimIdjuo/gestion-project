"use client";

import {
  addModePaiementProduits,
  deleteModePaiementProduits,
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

type modePaiement = {
  modePaiement: string;
  id: string;
};

export default function ModePaiementsProduits() {
  const [value, setValue] = useState<string>(""); //Inpute value
  const [modePaiement, setmodePaiement] = useState<modePaiement | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);

  const getModePaiements = async () => {
    const response = await axios.get("/api/modesPaiement");
    const modesPaiement = response.data.modesPaiement;
    console.log("modePaiements : ", modesPaiement);
    return modesPaiement;
  };

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["modePaiements"],
    queryFn: getModePaiements,
  });

  const addmodePaiement = useMutation({
    mutationFn: async (modePaiement: string) => {
      const loadingToast = toast.loading("Ajout du mode de paiement...");
      try {
        await addModePaiementProduits(modePaiement);
        toast.success("Mode de paiement ajouter avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["modePaiements"] });
    },
  });

  const deletemodePaiement = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression du mode de paiement...");
      try {
        await deleteModePaiementProduits(modePaiement?.id);
        toast(
          <span>
            Le mode : <b>{modePaiement?.modePaiement.toUpperCase()}</b> a été
            supprimé avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error) {
        toast.error("Échec de la suppression!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modePaiements"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen ">
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
                  <h1 className="text-3xl font-bold">Modes de paiement</h1>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"modesPaiement"} />
                  </div>
                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        addmodePaiement.mutate(value);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row gap-3 w-full mb-5">
                        <Input
                          placeholder="Mode de paiement ..."
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
                            <TableHead>Mode de paiement</TableHead>
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
                            query.data?.map((modePaiement: modePaiement) => (
                              <TableRow key={modePaiement.id}>
                                <TableCell className="font-medium">
                                  {modePaiement.modePaiement}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => {
                                        setmodePaiement(modePaiement);
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
                                Aucun mode trouvé
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
        recordName={modePaiement?.modePaiement}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deletemodePaiement.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
