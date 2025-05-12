"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImportClients from "@/components/importer-clients";
import { Search, Plus, X, Pen, Trash2, Upload } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingDots } from "@/components/loading-dots";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currClient, setcurrClient] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();

  const queryClient = useQueryClient();

  const clients = useQuery({
    queryKey: ["clients", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/clients", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      console.log("clients", response.data.clients);

      return response.data.clients;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const deleteClient = async () => {
    try {
      await axios.delete(`/api/clients/${currClient.id}`);
      toast(
        <span>
          Le client <b>{currClient?.nom.toUpperCase()}</b> a été supprimé avec
          succès!
        </span>,
        {
          icon: "🗑️",
        }
      );

      queryClient.invalidateQueries(["clients"]);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 ">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="flex gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher des clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                spellCheck={false}
              />
              <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                {clients.isFetching && !clients.isLoading && <LoadingDots />}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center ">
            <ImportClients>
              <Button
                variant="outline"
                className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </ImportClients>
            <ClientFormDialog />
          </div>
        </div>

        <div
          className={`grid ${
            isAddingClient || isUpdatingClient
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="grid gap-3 border mb-3 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ICE</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.isLoading ? (
                  [...Array(10)].map((_, index) => (
                    <TableRow
                      className="h-[2rem] MuiTableRow-root !py-2"
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
                      <TableCell className="!py-2">
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : clients.data?.length > 0 ? (
                  clients.data?.map((client) => (
                    <TableRow className="font-medium" key={client.id}>
                      <ClientInfoDialog client={client}>
                        <TableCell className="font-medium hover:text-purple-500 cursor-pointer !py-2">
                          <div className="flex flex-row gap-2 justify-start items-center">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.nom}`}
                              />
                              <AvatarFallback>
                                {getInitials(client.nom)}
                              </AvatarFallback>
                            </Avatar>
                            <h2 className="text-sm font-bold">
                              {client.titre
                                ? client.titre + ". " + client.nom.toUpperCase()
                                : client.nom.toUpperCase()}
                            </h2>
                          </div>
                        </TableCell>
                      </ClientInfoDialog>
                      <TableCell className="text-md !py-2">
                        {client.telephone}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {client.adresse}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {client.email}
                      </TableCell>
                      <TableCell className="text-md !py-2">
                        {client.ice}
                      </TableCell>
                      <TableCell className="text-right !py-2">
                        <div className="flex justify-end gap-2">
                          <ModifyClientDialog currClient={client} />
                          {/* <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() => {
                              setcurrClient(client);
                              setIsUpdatingClient(true);
                              setIsAddingClient(false);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button> */}
                          <Button
                            name="delete btn"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                            onClick={() => {
                              setIsDialogOpen(true);
                              setcurrClient(client);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableCell colSpan={6} align="center">
                    Aucun client trouvé
                  </TableCell>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {clients.data?.length > 0 ? (
        <CustomPagination
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
        />
      ) : (
        ""
      )}
      {/* {isUpdatingClient && (
        <ModifyClientDialog
          currClient={currClient}
          clientList={clients.data}
          isOpen={isUpdatingClient}
          onClose={() => setIsUpdatingClient(false)}
        />
      )} */}
      <DeleteConfirmationDialog
        recordName={currClient?.nom}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteClient();
          setIsDialogOpen(false);
          queryClient.invalidateQueries(["clients"]);
        }}
        itemType="client"
      ></DeleteConfirmationDialog>
    </>
  );
}
