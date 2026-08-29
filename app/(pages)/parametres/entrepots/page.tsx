"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Pen, Trash2 } from "lucide-react";
import { ChangeEvent, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Entrepot = {
  nom: string;
  id: string;
};

export default function EntrepotsPage() {
  const [value, setValue] = useState<string>("");
  const [entrepot, setEntrepot] = useState<Entrepot | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [editDialog, setEditDialog] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>("");

  const getEntrepots = async () => {
    const response = await axios.get("/api/entrepots");
    return response.data.entrepots;
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["entrepots"],
    queryFn: getEntrepots,
  });

  const addEntrepot = useMutation({
    mutationFn: async (nom: string) => {
      const loadingToast = toast.loading("Ajout de l'entrepôt...");
      try {
        await axios.post("/api/entrepots", { nom });
        toast.success("Entrepôt ajouté avec succès");
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Échec de l'ajout !"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["entrepots"] });
    },
  });

  const deleteEntrepot = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de l'entrepôt...");
      try {
        await axios.delete(`/api/entrepots/${entrepot?.id}`);
        toast(
          <span>
            L&apos;entrepôt <b>{entrepot?.nom.toUpperCase()}</b> a été
            supprimé avec succès !
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Échec de la suppression de l'entrepôt"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrepots"] });
    },
  });

  const updateEntrepot = useMutation({
    mutationFn: async (entrepotData: { id: string; nom: string }) => {
      const loadingToast = toast.loading("Modification de l'entrepôt...");
      try {
        await axios.put("/api/entrepots", entrepotData);
        toast.success("Entrepôt modifié avec succès");
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Échec de la modification de l'entrepôt"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setEditValue("");
      setEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["entrepots"] });
    },
  });

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Entrepôts</h1>
                </div>
                <div className="flex justify-between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"entrepots"} />
                  </div>

                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        addEntrepot.mutate(value);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row gap-3 w-full mb-5">
                        <Input
                          placeholder="Entrepôt ..."
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

                    <div className="rounded-lg border overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entrepôts</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {query.isLoading ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center">
                                Chargement ...
                              </TableCell>
                            </TableRow>
                          ) : query.data?.length > 0 ? (
                            query.data?.map((item: Entrepot) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.nom}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => {
                                        setEntrepot(item);
                                        setEditValue(item.nom);
                                        setEditDialog(true);
                                      }}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                    >
                                      <Pen className="h-4 w-4" />
                                      <span className="sr-only">Modifier</span>
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setEntrepot(item);
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
                                Aucun entrepôt trouvé
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
        recordName={entrepot?.nom}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteEntrepot.mutate();
          setDeleteDialog(false);
        }}
      />

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;entrepôt</DialogTitle>
            <DialogDescription>
              Modifiez le nom de l&apos;entrepôt ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (entrepot && editValue.trim() !== "") {
                updateEntrepot.mutate({
                  id: entrepot.id,
                  nom: editValue.trim(),
                });
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="entrepot"
                  placeholder="Entrepôt ..."
                  value={editValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditValue(e.target.value)
                  }
                  className="focus-visible:ring-emerald-500"
                  spellCheck={false}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialog(false);
                  setEditValue("");
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-emerald-400 hover:bg-emerald-500"
                disabled={editValue.trim() === "" || updateEntrepot.isLoading}
              >
                {updateEntrepot.isLoading ? "Modification..." : "Modifier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
