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
import { Search, Trash2, Upload } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingDots } from "@/components/loading-dots";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currClient, setcurrClient] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [totalPages, setTotalPages] = useState();
  const [isInfosDialogOpen, setIsInfosDialogOpen] = useState(false);

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

        <div className="grid gap-3 border mb-3 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Dette</TableHead>
                <TableHead>Adresse</TableHead>
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
                  <TableRow
                    onClick={() => {
                      setIsInfosDialogOpen(true);
                      setcurrClient(client);
                    }}
                    className="font-medium"
                    key={client.id}
                  >
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

                    <TableCell className="text-md !py-2">
                      {client.telephone}
                    </TableCell>
                    <TableCell className="text-md !py-2">
                      {client.dette}
                    </TableCell>
                    <TableCell className="text-md !py-2">
                      {client.adresse}
                    </TableCell>
                    <TableCell className="text-md !py-2">
                      {client.ice}
                    </TableCell>
                    <TableCell className="text-right !py-2">
                      <div className="flex justify-end gap-2">
                        <ModifyClientDialog currClient={client} />
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
                  <div className="text-center py-10 text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-14 mx-auto mb-4 opacity-50"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <p>Aucun client trouvé</p>
                  </div>
                </TableCell>
              )}
            </TableBody>
          </Table>
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
      <ClientInfoDialog
        client={currClient}
        isOpen={isInfosDialogOpen}
        onClose={() => setIsInfosDialogOpen(false)}
      />
    </>
  );
}
