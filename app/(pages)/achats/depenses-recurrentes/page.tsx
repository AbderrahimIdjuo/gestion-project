"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import { deleteManyFactures } from "@/app/api/actions";
import { payeManyFactures } from "@/app/api/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  X,
  Pen,
  Trash2,
  CircleDollarSign,
  EllipsisVertical,
} from "lucide-react";
import { AddFactureForm } from "@/components/add-facture-recurrente-form";
import { PaymentDialog } from "@/components/select-bank-account";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DeleteManyConfirmation } from "@/components/delete-many-confirmation";
import { UpdateFactureRecurrenteForm } from "@/components/update-facture-recurrente-form";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
type Facture = {
  date: Date;
  numero: string;
  id: string;
  lable: string;
  montant: number;
  type: string;
  payer: boolean;
  description: string;
};
function Page() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currfacture, setCurrFacture] = useState<Facture | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManyDialogOpen, setIsManyDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isAddingfacture, setIsAddingfacture] = useState(false);
  const [isUpdatingfacture, setIsUpdatingfacture] = useState(false);
  const itemsPerPage = 10;
  const [selectedFactures, setSelectedFactures] = useState<Set<string>>(
    new Set()
  );

  const getFactures = async () => {
    const response = await axios.get("/api/factures");
    const factures = response.data.factures;
    console.log("factures : ", factures);
    return factures;
  };
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["factures"], queryFn: getFactures });

  const toggleFacture = (id: string) => {
    const newSelected = new Set(selectedFactures);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFactures(newSelected);
  };
  const facturesRecurrentes = query.data?.filter(
    (facture: Facture) => facture.type === "récurrente"
  );

  const toggleAll = () => {
    if (selectedFactures.size === facturesRecurrentes?.length) {
      setSelectedFactures(new Set());
    } else {
      setSelectedFactures(
        new Set(facturesRecurrentes.map((facture: Facture) => facture.id))
      );
    }
  };

  const filteredFactures = query.data?.filter(
    (facture: Facture) =>
      (facture.lable.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facture.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      facture.type === "récurrente"
  );

  const totalPages = Math.ceil(filteredFactures?.length / itemsPerPage);
  const currentFactures = filteredFactures?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const payerFacture = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Paiement de la facture...");
      try {
        const response = await axios.put(`/api/factures/${currfacture?.id}`);
        toast.success("Paiement effecuter avec succès");

        return response.data;
      } catch (error) {
        toast.error("Échec du paiement!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
  const handlePayeMany = useMutation({
    mutationFn: async (selectedFactures: Set<string>) => {
      const loadingToast = toast.loading("Paiement des factures...");
      try {
        await payeManyFactures(Array.from(selectedFactures));
        toast.success("Paiement effecuter avec succès");
        setSelectedFactures(new Set());
      } catch (error) {
        toast.error("Échec du paiement!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
  const handleDeleteMany = useMutation({
    mutationFn: async (selectedFactures: Set<string>) => {
      const loadingToast = toast.loading("Suppression des factures...");
      try {
        await deleteManyFactures(Array.from(selectedFactures));
        toast.success("Suppression effecuter avec succès");
      } catch (error) {
        toast.error("Échec de la suppression!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });

  const deleteFacture = useMutation({
    mutationFn: async () => {
      const loadingToast = toast.loading("Suppression de la facture...");
      try {
        const response = await axios.delete(`/api/factures/${currfacture?.id}`);
        toast(
          <span>
            La facture <b>{currfacture?.lable.toUpperCase()}</b> a été supprimé
            avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
        return response.data;
      } catch (error) {
        toast.error("Échec de la suppression de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
  const payerFactureUnique = () => {
    if (currfacture?.payer === false) {
      payerFacture.mutate();
    } else {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="p-4 ml-3 flex-1">
            <p className="mt-1 text-md text-gray-500">
              La facture :{" "}
              <span className=" font-semibold text-gray-900">
                {currfacture?.numero}{" "}
              </span>
              est déja payer
            </p>
          </div>
        </div>
      ));
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-start gap-2 items-center">
          <span className="text-3xl font-bold">Dépenses récurrentes </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des factures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
          </div>

          <Button
            onClick={() => {
              setIsAddingfacture(!isAddingfacture);
              if (isUpdatingfacture) {
                setIsUpdatingfacture(false);
                setIsAddingfacture(false);
              }
              setSelectedFactures(new Set());
            }}
            className={`${
              isAddingfacture || isUpdatingfacture
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
            } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
          >
            {isAddingfacture || isUpdatingfacture ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une facture
              </>
            )}
          </Button>
        </div>

        <div
          className={`grid ${
            isAddingfacture || isUpdatingfacture
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingfacture || isUpdatingfacture ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      {currentFactures?.length > 0 && (
                        <Checkbox
                          checked={
                            selectedFactures.size ===
                            facturesRecurrentes?.length
                          }
                          onCheckedChange={toggleAll}
                        />
                      )}
                    </TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">
                      <div className="flex gap-2 items-center justify-end">
                        Actions
                        <DropdownMenu
                          open={dropdownOpen}
                          onOpenChange={setDropdownOpen}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              onClick={() => setDropdownOpen((prev) => !prev)}
                              size="icon"
                              variant="ghost"
                              className="focus:!ring-0 focus:!ring-offset-0"
                              disabled={
                                selectedFactures.size > 0 ? false : true
                              }
                            >
                              <EllipsisVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDropdownOpen(false);

                                // handlePayeMany.mutate(selectedFactures);
                                setIsBankDialogOpen(true);
                              }}
                            >
                              Payer les factures sélectionnées.
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDropdownOpen(false);
                                setIsManyDialogOpen(true);
                              }}
                            >
                              Supprimer les factures sélectionnées.
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isLoading ? (
                    [...Array(10)].map((_, index) => (
                      <TableRow
                        className="h-[2rem] MuiTableRow-root"
                        role="checkbox"
                        tabIndex={-1}
                        key={index}
                      >
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[20px]" />
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
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
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
                  ) : currentFactures?.length > 0 ? (
                    currentFactures?.map((facture: Facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="text-md">
                          <Checkbox
                            checked={selectedFactures.has(facture.id)}
                            onCheckedChange={() => {
                              toggleFacture(facture.id);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.numero}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.lable}
                        </TableCell>
                        <TableCell className="text-md">
                          {facture.montant} DH
                        </TableCell>
                        <TableCell className="text-md">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${
                              facture.payer
                                ? "bg-green-100 text-green-600 font-medium"
                                : "bg-red-100 text-red-600 font-medium"
                            }`}
                          >
                            {facture.payer ? "Payé" : "Impayé"}
                          </span>
                        </TableCell>

                        <TableCell className="text-md">
                          {facture.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setCurrFacture(facture);
                                  setIsUpdatingfacture(true);
                                  setIsAddingfacture(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                            <CustomTooltip message="payer">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                                onClick={() => {
                                  setIsBankDialogOpen(true);
                                  setCurrFacture(facture);
                                }}
                              >
                                <CircleDollarSign className="h-4 w-4" />
                              </Button>
                            </CustomTooltip>
                            <CustomTooltip message="Supprimer">
                              <Button
                                name="delete btn"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                onClick={() => {
                                  setIsDialogOpen(true);
                                  setCurrFacture(facture);
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
                        Aucune facture trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the facture , statut de paiement , montant and actions columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingfacture && !isUpdatingfacture ? "hidden" : ""
              } `}
            >
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.isLoading ? (
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
                            <div className="flex gap-2 items-center">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </TableCell>
                          <TableCell className="!py-2" align="right">
                            <Skeleton className="h-4 w-[100px]" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : currentFactures?.length > 0 ? (
                      currentFactures?.map((facture: Facture) => (
                        <TableRow key={facture.id}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <div className="grid grid-rows-2">
                                <h1>{facture.lable.toUpperCase()}</h1>
                                <p className="text-sm text-muted-foreground">
                                  {facture.numero}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-md">
                            {facture.montant} DH
                          </TableCell>
                          <TableCell className="text-md">
                            <span
                              className={`text-sm  p-[1px] px-3 rounded-full  ${
                                facture.payer
                                  ? "bg-green-100 text-green-600 font-medium"
                                  : "bg-red-100 text-red-600 font-medium"
                              }`}
                            >
                              {facture.payer ? "Payé" : "Impayé"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <CustomTooltip message="Modifier">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                  onClick={() => {
                                    setCurrFacture(facture);
                                    setIsUpdatingfacture(true);
                                    setIsAddingfacture(false);
                                  }}
                                >
                                  <Pen className="h-4 w-4" />
                                </Button>
                              </CustomTooltip>
                              <CustomTooltip message="payer">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                                  onClick={() => {
                                    setIsBankDialogOpen(true);
                                    setCurrFacture(facture);
                                  }}
                                >
                                  <CircleDollarSign className="h-4 w-4" />
                                </Button>
                              </CustomTooltip>
                              <CustomTooltip message="Supprimer">
                                <Button
                                  name="delete btn"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                  onClick={() => {
                                    setIsDialogOpen(true);
                                    setCurrFacture(facture);
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
                        <TableCell colSpan={4} align="center">
                          Aucune facture trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            {filteredFactures?.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          <div className={`${!isUpdatingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isUpdatingfacture && (
                <UpdateFactureRecurrenteForm
                  currFacture={currfacture}
                  setIsUpdatingfacture={setIsUpdatingfacture}
                />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isAddingfacture && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isAddingfacture && <AddFactureForm />}
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currfacture?.lable}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteFacture.mutate();
          setIsDialogOpen(false);
        }}
      />
      <DeleteManyConfirmation
        isOpen={isManyDialogOpen}
        onClose={() => {
          setIsManyDialogOpen(false);
        }}
        onConfirm={() => {
          handleDeleteMany.mutate(selectedFactures);
          setIsManyDialogOpen(false);
        }}
      />
      <PaymentDialog
        isOpen={isBankDialogOpen}
        onClose={() => setIsBankDialogOpen(false)}
        onConfirm={() => {
          if (selectedFactures.size > 0) {
            handlePayeMany.mutate(selectedFactures);
          } else payerFactureUnique();
          setIsManyDialogOpen(false);
        }}
      />
    </>
  );
}

export default Page;
