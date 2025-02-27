"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, X, Pen, Trash2 } from "lucide-react";
import { AddEmployeForm } from "@/components/add-employe-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EmployeInfoDialog } from "@/components/employe-info-card";
import { UpdateEmployeForm } from "@/components/update-employe-form";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function EmployesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currEmploye, setcurrEmploye] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingEmploye, setIsAddingEmploye] = useState(false);
  const [isUpdatingEmploye, setIsUpdatingEmploye] = useState(false);
  const itemsPerPage = 10;

  const getEmployes = async () => {
    const response = await axios.get("/api/employes");
    const employes = response.data.employes;
    console.log("employes : ", employes);
    return employes;
  };
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["employes"], queryFn: getEmployes });

  const filteredEmployes = query.data?.filter(
    (employe) =>
      employe.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.adresse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.telephone?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredEmployes?.length / itemsPerPage);
  const currentEmployes = filteredEmployes?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const deleteEmploye = useMutation({
    mutationFn: async (id) => {
      const loadingToast = toast.loading("Suppression de l'employé...");
      try {
        const response = await axios.delete(`/api/employes/${id}`);
        toast(
          <span>
            L&apos;employé <b>{currEmploye?.nom.toUpperCase()}</b> a été
            supprimé avec succès!
          </span>,
          {
            icon: "🗑️",
          }
        );
        return response.data;
      } catch (error) {
        toast.error("Échec de la suppression de l'employe");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  function formatRIB(rib) {
    return `${rib.slice(0, 3)} ${rib.slice(3, 6)} ${rib.slice(
      6,
      19
    )} ${rib.slice(19, 21)}`;
  }
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 caret-transparent">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Employés</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des Employes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
              spellCheck={false}
            />
          </div>
          <Button
            onClick={() => {
              setIsAddingEmploye(!isAddingEmploye);
              if (isUpdatingEmploye) {
                setIsUpdatingEmploye(false);
                setIsAddingEmploye(false);
              }
            }}
            className={`${
              isAddingEmploye || isUpdatingEmploye
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
            } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
          >
            {isAddingEmploye || isUpdatingEmploye ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un employé
              </>
            )}
          </Button>
        </div>

        <div
          className={`grid ${
            isAddingEmploye || isUpdatingEmploye
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2 mb-10">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingEmploye || isUpdatingEmploye ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Tâche</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>CIN</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>RIB</TableHead>
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
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentEmployes?.length > 0 ? (
                    currentEmployes?.map((employe) => (
                      <TableRow key={employe.id}>
                        <EmployeInfoDialog employe={employe}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${employe.nom}`}
                                />
                                <AvatarFallback>
                                  {getInitials(employe.nom)}
                                </AvatarFallback>
                              </Avatar>
                              <h2 className="text-sm font-bold">
                                {employe.nom.toUpperCase()}
                              </h2>
                            </div>
                          </TableCell>
                        </EmployeInfoDialog>
                        <TableCell className="text-md">
                          {employe.telephone}
                        </TableCell>
                        <TableCell className="text-md">
                          {employe.role}
                        </TableCell>
                        <TableCell className="text-md">
                          {employe.salaire}
                        </TableCell>
                        <TableCell className="text-md">{employe.cin}</TableCell>
                        <TableCell className="text-md">
                          {employe.adresse}
                        </TableCell>
                        <TableCell className="text-md">
                          <CustomTooltip message={formatRIB(employe.rib)}>
                            {employe.rib && (
                              <span className="cursor-default">
                                {formatRIB(employe.rib).slice(0, 10)} ...
                              </span>
                            )}
                          </CustomTooltip>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <CustomTooltip message="Modifier">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                onClick={() => {
                                  setcurrEmploye(employe);
                                  setIsUpdatingEmploye(true);
                                  setIsAddingEmploye(false);
                                }}
                              >
                                <Pen className="h-4 w-4" />
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
                                  setcurrEmploye(employe);
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
                      <TableCell colSpan={8} align="center">
                        Aucun employé trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the name and Action columns */}
            <div>
              <ScrollArea
                className={`w-full h-[80vh]  grid gap-3  border mb-3 rounded-lg ${
                  !isAddingEmploye && !isUpdatingEmploye ? "hidden" : ""
                } `}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
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
                    ) : currentEmployes?.length > 0 ? (
                      currentEmployes?.map((employe) => (
                        <TableRow key={employe.id}>
                          <EmployeInfoDialog employe={employe}>
                            <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                              <div className="flex flex-row gap-2 justify-start items-center">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${employe.nom}`}
                                  />
                                  <AvatarFallback>
                                    {getInitials(employe.nom)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="grid grid-rows-2">
                                  <h2 className="text-sm font-bold">
                                    {employe.nom.toUpperCase()}
                                  </h2>

                                  <p className="text-sm text-muted-foreground">
                                    {employe.telephone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </EmployeInfoDialog>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <CustomTooltip message="Modifier">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                  onClick={() => {
                                    setcurrEmploye(employe);
                                    setIsUpdatingEmploye(true);
                                    setIsAddingEmploye(false);
                                  }}
                                >
                                  <Pen className="h-4 w-4" />
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
                                    setcurrEmploye(employe);
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
                        <TableCell colSpan={2} align="center">
                          Aucun employe trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            {filteredEmployes?.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          <div className={`${!isUpdatingEmploye && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isUpdatingEmploye && (
                <UpdateEmployeForm
                  currEmploye={currEmploye}
                  setIsUpdatingEmploye={setIsUpdatingEmploye}
                />
              )}
            </ScrollArea>
          </div>
          <div className={`${!isAddingEmploye && "hidden"} `}>
            <ScrollArea className="w-full h-[75vh]">
              {isAddingEmploye && <AddEmployeForm />}
            </ScrollArea>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currEmploye?.nom}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteEmploye.mutate(currEmploye.id);
          setIsDialogOpen(false);
        }}
        itemType="employe"
      ></DeleteConfirmationDialog>
    </>
  );
}
