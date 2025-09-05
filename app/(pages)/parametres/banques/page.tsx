"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdatSolde from "@/components/update-caisse-solde";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Toaster } from "react-hot-toast";

type Compte = {
  compte: string;
  solde: string;
  id: string;
};

export default function Banques() {
  const getcomptes = async () => {
    const response = await axios.get("/api/comptesBancaires");
    const comptes = response.data.comptes;
    console.log("comptes : ", comptes);
    return comptes;
  };
  const query = useQuery({
    queryKey: ["comptes"],
    queryFn: getcomptes,
  });

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
                  <h1 className="text-3xl font-bold">Comptes Bancaires</h1>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"banques"} />
                  </div>

                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Comptes</TableHead>
                            <TableHead>Solde</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
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
                            query.data?.map((compte: Compte) => (
                              <TableRow key={compte.id}>
                                <TableCell className="font-medium">
                                  {compte.compte}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {compte.solde} DH
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <UpdatSolde
                                      solde={compte.solde}
                                      id={compte.id}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center">
                                Aucun compte trouvée
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
