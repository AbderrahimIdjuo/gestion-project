"use client";

import { ArticlForm } from "@/components/add-articl-form";
import CustomPagination from "@/components/customUi/customPagination";
import CustomTooltip from "@/components/customUi/customTooltip";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import ImportArticls from "@/components/importer-articls";
import { LoadingDots } from "@/components/loading-dots";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
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
import { UpdateArticlForm } from "@/components/update-articl-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Pen, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ProduitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [currArticl, setCurrArticl] = useState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState();
  const [totalPages, setTotalPages] = useState();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500); // Adjust delay as needed

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const queryClient = useQueryClient();
  const articls = useQuery({
    queryKey: ["articls", debouncedQuery, page],
    queryFn: async () => {
      const response = await axios.get("/api/articls", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      setTotalPages(response.data.totalPages);
      return response.data.articls;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  const deleteArticl = async () => {
    try {
      await axios.delete(`/api/articls/${currArticl.id}`);
      toast(
        <span>
          Le produit <b>{currArticl?.designation.toUpperCase()}</b> a été
          supprimé avec succès!
        </span>,
        {
          icon: "🗑️",
        }
      );
      queryClient.invalidateQueries(["articls"]);
    } catch (e) {
      console.log(e);
    }
  };

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
              <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Articls</h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Recherche..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-full rounded-full bg-gray-50 focus-visible:ring-purple-500 focus-visible:ring-offset-0"
                      spellCheck={false}
                    />
                    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                      {articls.isFetching && !articls.isLoading && (
                        <LoadingDots />
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <ImportArticls>
                      <Button
                        variant="outline"
                        className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Importer
                      </Button>
                    </ImportArticls>
                    <Button
                      onClick={() => {
                        setAddDialogOpen(true);
                      }}
                      className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un articl
                    </Button>
                  </div>
                </div>

                <div className="col-span-2 mb-10">
                  <div className="border mb-5 rounded-lg">
                    {/* the full table  */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Désignation</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articls.isLoading ? (
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
                                <Skeleton className="h-4 w-[150px]" />
                              </TableCell>
                              <TableCell
                                className="!py-2 text-sm md:text-base"
                                align="left"
                              >
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
                        ) : articls.data?.length > 0 ? (
                          articls.data?.map(articl => (
                            <TableRow key={articl.id}>
                              <TableCell className="font-medium !py-2">
                                {articl.designation}
                              </TableCell>
                              <TableCell className="font-medium !py-2">
                                {articl.categorie}
                              </TableCell>
                              <TableCell className="text-right !py-2">
                                <div className="flex justify-end gap-2">
                                  <CustomTooltip message="Modifier">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                      onClick={() => {
                                        setCurrArticl(articl);
                                        setUpdateDialogOpen(true);
                                        console.log(
                                          "modifier un articl",
                                          articl
                                        );
                                      }}
                                    >
                                      <Pen className="h-4 w-4" />
                                    </Button>
                                  </CustomTooltip>
                                  <CustomTooltip message="Supprimer">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                      onClick={() => {
                                        setCurrArticl(articl);
                                        setDeleteDialogOpen(true);
                                        console.log("delete un articl", articl);
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
                            <TableCell colSpan={3} align="center">
                              Aucun articl trouvé
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {articls.data?.length > 0 && (
                    <CustomPagination
                      currentPage={page}
                      setCurrentPage={setPage}
                      totalPages={totalPages}
                    />
                  )}
                </div>

                <DeleteConfirmationDialog
                  recordName={currArticl?.designation}
                  isOpen={deleteDialogOpen}
                  onClose={() => setDeleteDialogOpen(false)}
                  onConfirm={() => {
                    setDeleteDialogOpen(false);
                    deleteArticl();
                  }}
                />

                <ArticlForm
                  isOpen={addDialogOpen}
                  onClose={() => setAddDialogOpen(false)}
                  onConfirm={() => {
                    setAddDialogOpen(false);
                  }}
                />
                <UpdateArticlForm
                  articl={currArticl}
                  isOpen={updateDialogOpen}
                  onClose={() => setUpdateDialogOpen(false)}
                  onConfirm={() => {
                    setUpdateDialogOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
