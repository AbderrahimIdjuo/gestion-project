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
import { addCategorieProduits } from "@/app/api/actions";
import { deleteCategorieProduits } from "@/app/api/actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Charge = {
  charge: string;
  id: string;
};

export default function ChargesProduits() {
  const [value, setValue] = useState<string>(""); //Inpute value
  const [charge, setCharge] = useState<Charge | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);

  const getCharges = async () => {
    const response = await axios.get("/api/charges");
    const charges = response.data.charges;
    console.log("charges : ", charges);
    return charges;
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["charges"],
    queryFn: getCharges,
  });

  const addCategorie = useMutation({
    mutationFn: async (charge: string) => {
      const loadingToast = toast.loading("Ajout de la charge...");
      try {
        await axios.post("/api/charges", { charge });
        toast.success("Charge ajouter avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["charges"] });
    },
  });

  const deleteCharge = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la charge...");
      try {
        await axios.delete(`/api/charges/`, { data: { id: charge?.id } });
        toast(
          <span>
            La charge <b>{charge?.charge.toUpperCase()}</b> a été supprimé
            avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error) {
        toast.error("Échec de la suppression de la charge");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
    },
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Charges récurrentes</h1>
        </div>
        <div className="flex justify between gap-6 items-start">
          <div className="hidden md:block">
            <SittingsSideBar page={"charges"} />
          </div>

          <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCategorie.mutate(value);
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3 w-full mb-5">
                <Input
                  placeholder="Charges ..."
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
            <ScrollArea className="rounded-lg border w-full h-[70vh]">
              <Table className="w-full min-w-[500px]">
                {" "}
                {/* min-width for scroll */}
                <TableHeader>
                  <TableRow>
                    <TableHead>Charges</TableHead>
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
                    query.data?.map((charge: Charge) => (
                      <TableRow key={charge.id}>
                        <TableCell className="font-medium">
                          {charge.charge}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setCharge(charge);
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
                        Aucune charge trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={charge?.charge}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
        }}
        onConfirm={() => {
          deleteCharge.mutate();
          setDeleteDialog(false);
        }}
      />
    </>
  );
}
