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
import { Search, Plus, X, Pen, Trash2} from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currClient, setcurrClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientList, setClientList] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const itemsPerPage = 10;

  const filteredClients = clientList.filter(
    (client) =>
      client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.adresse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.telephone?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice(
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
  const getClients = async () => {
    const result = await axios.get("/api/clients");
    const { Clients } = result.data;
    setClientList(Clients);
    setIsLoading(false);
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

      getClients();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    getClients();
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6 caret-transparent">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 ">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
            spellCheck={false}
            />
          </div>
          <Button
            onClick={() => {
              setIsAddingClient(!isAddingClient);
              if (isUpdatingClient) {
                setIsUpdatingClient(false);
                setIsAddingClient(false);
              }
            }}
            className={`${
              isAddingClient || isUpdatingClient
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 "
            } text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full`}
          >
            {isAddingClient || isUpdatingClient ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un client
              </>
            )}
          </Button>
        </div>

        <div
          className={`grid ${
            isAddingClient || isUpdatingClient
              ? "grid-cols-3 gap-6"
              : "grid-cols-1"
          }`}
        >
          <div className="col-span-2">
            <div
              className={`grid gap-3 border mb-3 rounded-lg ${
                isAddingClient || isUpdatingClient ? "hidden" : ""
              } `}
            >
              {/* the full table  */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
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
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-7 w-7 rounded-full" />
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : currentClients.length > 0 ? (
                    currentClients?.map((client) => (
                      <TableRow key={client.id}>
                        <ClientInfoDialog client={client}>
                          <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                            <div className="flex flex-row gap-2 justify-start items-center">
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.nom}`}
                                />
                                <AvatarFallback>
                                  {getInitials(client.nom)}
                                </AvatarFallback>
                              </Avatar>
                              <h2 className="text-sm font-bold">
                                {client.nom.toUpperCase()}
                              </h2>
                            </div>
                          </TableCell>
                        </ClientInfoDialog>
                        <TableCell className="text-md">
                          {client.telephone}
                        </TableCell>
                        <TableCell className="text-md">
                          {client.adresse}
                        </TableCell>
                        <TableCell className="text-md">
                          {client.email}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
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
                            </Button>
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
                    <TableCell colSpan={5} align="center">
                      Aucun client trouvé
                    </TableCell>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* the half table with the name and Action columns */}
            <ScrollArea
              className={`h-[35rem] w-full  grid gap-3  border mb-3 rounded-lg ${
                !isAddingClient && !isUpdatingClient ? "hidden" : ""
              } `}
            >
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
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
                    ) : currentClients.length > 0 ? (
                      currentClients?.map((client) => (
                        <TableRow key={client.id}>
                          <ClientInfoDialog client={client}>
                            <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                              <div className="flex flex-row gap-2 justify-start items-center">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.nom}`}
                                  />
                                  <AvatarFallback>
                                    {getInitials(client.nom)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="grid grid-rows-2">
                                  <h2 className="text-sm font-bold">
                                    {client.nom.toUpperCase()}
                                  </h2>

                                  <p className="text-sm text-muted-foreground">
                                    {client.telephone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </ClientInfoDialog>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
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
                              </Button>
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
                      <TableCell colSpan={2} align="center">
                        Aucun client trouvé
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            {filteredClients.length > 0 ? (
              <CustomPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            ) : (
              ""
            )}
          </div>
          {isUpdatingClient && (
            <ModifyClientDialog
              currClient={currClient}
              getClients={getClients}
              clientList={clientList}
              setIsUpdatingClient={setIsUpdatingClient}
            />
          )}
          {isAddingClient && <ClientFormDialog getClients={getClients} clientList={clientList} />}
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={currClient?.nom}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          deleteClient();
          setIsDialogOpen(false);
          getClients();
        }}
        itemType="client"
      ></DeleteConfirmationDialog>
    </>
  );
}
