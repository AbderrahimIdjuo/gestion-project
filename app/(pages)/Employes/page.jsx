"use client";

import { AddEmployeDialog } from "@/components/add-employe-dialog";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EmployeInfoDialog } from "@/components/employe-info-card";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpdateEmployeDialog } from "@/components/update-employe-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Pen, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function EmployesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currEmploye, setcurrEmploye] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const employes = useQuery({
    queryKey: ["employes", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/employes", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.employes;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });
  const getInitials = name => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const deleteEmploye = useMutation({
    mutationFn: async id => {
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

  function formatRIB(rib) {
    if (!rib || rib === null || rib === undefined || rib === "") {
      return "";
    }
    return `${rib.slice(0, 3)} ${rib.slice(3, 6)} ${rib.slice(
      6,
      19
    )} ${rib.slice(19, 21)}`;
  }
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
              <div className="space-y-6 mb-[5rem] p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Employés</h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des employés..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      spellCheck={false}
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {employes.isFetching && !employes.isLoading && (
                        <LoadingDots />
                      )}
                    </div>
                  </div>
                  <AddEmployeDialog />
                </div>

                <div className="grid grid-cols-1">
                  <div className="mb-10">
                    <div className="grid gap-3 border mb-3 rounded-lg">
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
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employes.isLoading ? (
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
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                  </div>
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2" align="left">
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                                <TableCell className="!py-2">
                                  <div className="flex gap-2 justify-end">
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : employes.data?.length > 0 ? (
                            employes.data?.map(employe => (
                              <TableRow
                                className="font-medium"
                                key={employe.id}
                              >
                                <EmployeInfoDialog employe={employe}>
                                  <TableCell className="font-medium hover:text-purple-500 cursor-pointer !py-2">
                                    <div className="flex flex-row gap-2 justify-start items-center">
                                      <Avatar className="w-8 h-8">
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
                                <TableCell className="text-md !py-2">
                                  {employe.telephone}
                                </TableCell>
                                <TableCell className="text-md !py-2">
                                  {employe.role}
                                </TableCell>
                                <TableCell className="text-md !py-2">
                                  {employe.salaire}
                                </TableCell>
                                <TableCell className="text-md !py-2">
                                  {employe.cin}
                                </TableCell>
                                <TableCell className="text-md !py-2">
                                  {employe.adresse}
                                </TableCell>
                                <TableCell className="text-md !py-2">
                                  {employe.rib ? (
                                    <CustomTooltip
                                      message={formatRIB(employe.rib)}
                                    >
                                      <span className="cursor-default">
                                        {formatRIB(employe.rib).slice(0, 10)}{" "}
                                        ...
                                      </span>
                                    </CustomTooltip>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right !py-2">
                                  <div className="flex justify-end gap-2">
                                    <CustomTooltip message="Modifier">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                        onClick={() => {
                                          setcurrEmploye(employe);
                                          setIsUpdateDialogOpen(true);
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

                    {employes.data?.length > 0 ? (
                      <CustomPagination
                        currentPage={page}
                        setCurrentPage={setPage}
                        totalPages={totalPages}
                      />
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UpdateEmployeDialog
        employe={currEmploye}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />
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
