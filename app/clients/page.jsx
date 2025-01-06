"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import CustomPagination from "@/components/customUi/customPagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pen, Trash2, ShoppingBag } from "lucide-react";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ClientInfoDialog } from "@/components/client-info-dialog";
import { ModifyClientDialog } from "@/components/modify-client-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currClient, setcurrClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientList, setClientList] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;

  const filteredClients = clientList.filter(
    (client) =>
      client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher des clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
            />
          </div>
          <ClientFormDialog getClients={getClients}>
            <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Client
            </Button>
          </ClientFormDialog>
        </div>

        <div className="border rounded-lg">
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
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={index}
                  >
                    <TableCell
                      className="!py-2 text-sm md:text-base"
                      key={index}
                      align="left"
                    >
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="left">
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell className="!py-2" key={index} align="right">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : currentClients.length > 0 ? (
                currentClients?.map((client) => (
                  <TableRow key={client.id}>
                    <ClientInfoDialog client={client}>
                      <TableCell className="font-medium cursor-pointer hover:text-purple-600">
                        {client.nom.toUpperCase()}
                      </TableCell>
                    </ClientInfoDialog>
                    <TableCell>{client.telephone}</TableCell>
                    <TableCell>{client.adresse}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ModifyClientDialog
                          currClient={currClient}
                          getClients={getClients}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                            onClick={() => {
                              setcurrClient(client);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </ModifyClientDialog>
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

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
                          onClick={() => {}}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span className="sr-only">Nouvelle commande</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableCell colSpan={4} align="center">
                  Aucun client trouvé
                </TableCell>
              )}
            </TableBody>
          </Table>
        </div>

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
