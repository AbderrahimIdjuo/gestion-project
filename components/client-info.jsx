"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  Smartphone,
  NotebookText,
  Hash,
  CreditCard,
  FileText,
  TrendingUp,
  Receipt,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Spinner from "@/components/customUi/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { formatDate } from "@/lib/functions";

export function ClientInfoDialog({ client, isOpen, onClose }) {
  const [devis, setDevis] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const data = useQuery({
    queryKey: ["clientStatistiques", client],
    queryFn: async () => {
      const response = await axios.get("/api/clients/statistiques", {
        params: { clientId: client?.id },
      });
      setDevis(response.data.devis);
      setTransactions(response.data.transactions);
      console.log("response.data", response.data);
      return response.data;
    },
    enabled: !!client?.id,
  });
  const getStatusColor = (status) => {
    switch (status) {
      case "En attente":
        return "bg-amber-500";
      case "Accepté":
        return "bg-emerald-500";
      case "Annulé":
        return "bg-red-500";
      case "Expiré":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const chiffreAffaires = devis.reduce(
    (sum, devis) => sum + devis.totalPaye,
    0
  );
  return (
    <div className="p-8">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informations du client</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 h-full">
            <div className="space-y-4 grid  lg:grid-cols-2 grid-cols-1 grid-rows-2  lg:grid-rows-1 gap-4 justify-items-stretch">
              <Card className="w-full col">
                <CardHeader className=" pb-0">
                  <CardTitle className="text-lg pb-0 flex gap-2 items-center">
                    {client?.titre && client?.titre + ". "}
                    {client?.nom?.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {client?.ice && (
                      <div className="flex items-center group hover:text-purple-600">
                        <Hash className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600 " />
                        <span>ICE : {client?.ice}</span>
                      </div>
                    )}
                    {client?.mobile && (
                      <div className="flex items-center group hover:text-purple-600">
                        <Smartphone className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600" />
                        <span>{client?.mobile}</span>
                      </div>
                    )}
                    {client?.telephone && (
                      <div className="flex items-center group hover:text-purple-600">
                        <Phone className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600" />
                        <span>{client?.telephone}</span>
                      </div>
                    )}
                    {client?.email && (
                      <div className="flex items-center group hover:text-purple-600">
                        <Mail className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600" />
                        <span>{client?.email}</span>
                      </div>
                    )}
                    {client?.adresse && (
                      <div className="flex items-center group hover:text-purple-600">
                        <MapPin className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600" />
                        <span>{client?.adresse}</span>
                      </div>
                    )}

                    {client?.note && (
                      <div className="flex items-center group hover:text-purple-600">
                        <NotebookText className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-purple-600 " />
                        <span>{client?.note}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="grid items-center gap-2">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      Dette en cours :
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {formatCurrency(client?.dette)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Chiffre d&apos;Affaires :
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-lg text-white bg-green-600 px-3 py-1"
                  >
                    {formatCurrency(chiffreAffaires)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4 grid grid-cols-1 grid-rows-2 grid-rows-1 justify-items-stretch">
              {/* liste de devis */}
              <Card className="flex-1">
                <CardHeader className="grid grid-cols-5 items-center">
                  <CardTitle className="flex items-center gap-2 col-span-3">
                    <FileText className="h-5 w-5" />
                    Devis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.isLoading ? (
                    <div className="flex justify-center w-full">
                      <Spinner />
                    </div>
                  ) : devis.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Montant total</TableHead>
                          <TableHead>Payé</TableHead>
                          <TableHead>Reste</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devis?.map((articl, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-sm">
                              {formatDate(articl.createdAt)}
                            </TableCell>
                            <TableCell className="text-left">
                              {articl.numero}
                            </TableCell>
                            <TableCell className="text-left">
                              {formatCurrency(articl.total)}
                            </TableCell>
                            <TableCell className="text-left">
                              {formatCurrency(articl.totalPaye)}
                            </TableCell>
                            <TableCell className="text-left">
                              {formatCurrency(articl.total - articl.totalPaye)}{" "}
                            </TableCell>
                            <TableCell className="!py-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${getStatusColor(
                                    articl.statut
                                  )}`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {articl.statut}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground">
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
                      <p>Aucun devis trouvé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Recent Payments */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Derniers Règlements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    {data.isLoading ? (
                      <div className="flex justify-center w-full">
                        <Spinner />
                      </div>
                    ) : transactions.lenght > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-left">Compte</TableHead>
                            <TableHead className="text-center">
                              M.Paiement
                            </TableHead>
                            <TableHead className="text-right">
                              Montant
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.map((reglement, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatDate(reglement.date)}
                                </div>
                              </TableCell>
                              <TableCell className="text-left font-medium text-sm">
                                {reglement.compte?.replace("compte ", "")}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 text-xs hover:bg-green-100"
                                >
                                  {reglement.methodePaiement}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm">
                                {formatCurrency(reglement.montant)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted-foreground">
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
                        <p>Aucune transaction trouvé</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4 grid grid-cols-1 justify-items-stretch"></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
