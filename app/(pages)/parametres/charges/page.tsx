"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type ChargeType = "fixe" | "variante";

type Charge = {
  charge: string;
  id: string;
  type?: ChargeType;
};

function chargeTypeClassName(type?: ChargeType) {
  return type === "variante"
    ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 focus:ring-amber-400"
    : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 focus:ring-blue-400";
}

export default function ChargesProduits() {
  const [value, setValue] = useState<string>("");
  const [type, setType] = useState<ChargeType>("fixe");
  const [charge, setCharge] = useState<Charge | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [typeSortDir, setTypeSortDir] = useState<"asc" | "desc" | null>(null);

  const getCharges = async () => {
    const response = await axios.get("/api/charges");
    const charges = response.data.charges;
    return charges;
  };
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["charges"],
    queryFn: getCharges,
  });

  const addCategorie = useMutation({
    mutationFn: async ({
      charge,
      type,
    }: {
      charge: string;
      type: ChargeType;
    }) => {
      const loadingToast = toast.loading("Ajout de la charge...");
      try {
        await axios.post("/api/charges", { charge, type });
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
      setType("fixe");
      queryClient.invalidateQueries({ queryKey: ["charges"] });
    },
  });

  const updateChargeType = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: ChargeType }) => {
      const loadingToast = toast.loading("Modification du type...");
      try {
        await axios.put("/api/charges", { id, type });
        toast.success("Type modifié avec succès");
      } catch (error) {
        toast.error("Échec de la modification!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
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
            La charge <b>{charge?.charge.toUpperCase()}</b> a été supprimé avec
            succès!
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

  const sortedCharges = useMemo(() => {
    const charges: Charge[] = query.data ?? [];
    if (!typeSortDir) return charges;
    return [...charges].sort((a, b) => {
      const typeA = a.type || "fixe";
      const typeB = b.type || "fixe";
      if (typeA !== typeB) {
        if (typeSortDir === "asc") {
          return typeA === "fixe" ? -1 : 1;
        }
        return typeA === "variante" ? -1 : 1;
      }
      return (a.charge || "").localeCompare(b.charge || "", "fr", {
        sensitivity: "base",
      });
    });
  }, [query.data, typeSortDir]);

  const TypeSortIcon =
    typeSortDir === "asc"
      ? ArrowUp
      : typeSortDir === "desc"
        ? ArrowDown
        : ArrowUpDown;

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
                  <h1 className="text-3xl font-bold">Charges</h1>
                </div>
                <div className="flex justify-between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"charges"} />
                  </div>

                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        addCategorie.mutate({ charge: value, type });
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
                        <Select
                          value={type}
                          onValueChange={value =>
                            setType(value as ChargeType)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[160px] rounded-full bg-gray-50 focus:ring-emerald-500">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixe">Fixe</SelectItem>
                            <SelectItem value="variante">Variante</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <TableHead>
                              <button
                                type="button"
                                onClick={() =>
                                  setTypeSortDir(prev =>
                                    prev === "asc"
                                      ? "desc"
                                      : prev === "desc"
                                        ? null
                                        : "asc"
                                  )
                                }
                                className="inline-flex items-center gap-1 font-semibold hover:text-emerald-700"
                              >
                                Type
                                <TypeSortIcon
                                  className={`h-3.5 w-3.5 ${
                                    typeSortDir
                                      ? "text-emerald-600"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            </TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {query.isLoading ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center">
                                Loading ...
                              </TableCell>
                            </TableRow>
                          ) : query.data?.length > 0 ? (
                            sortedCharges.map((charge: Charge) => (
                              <TableRow key={charge.id}>
                                <TableCell className="font-medium">
                                  {charge.charge}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={charge.type || "fixe"}
                                    onValueChange={value =>
                                      updateChargeType.mutate({
                                        id: charge.id,
                                        type: value as ChargeType,
                                      })
                                    }
                                    disabled={updateChargeType.isLoading}
                                  >
                                    <SelectTrigger
                                      className={`w-[120px] h-8 rounded-full border font-medium ${chargeTypeClassName(
                                        charge.type
                                      )}`}
                                    >
                                      {(charge.type || "fixe") === "variante"
                                        ? "Variante"
                                        : "Fixe"}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fixe">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                          Fixe
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="variante">
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                          Variante
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
                              <TableCell colSpan={3} className="text-center">
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
            </div>
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
