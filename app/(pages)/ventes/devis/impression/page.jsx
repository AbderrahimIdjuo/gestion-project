"use client";
import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatMontant } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Fragment, useEffect, useState } from "react";
import "./page.css";

export default function ImpressionTransactions() {
  const [params, setParams] = useState();
  const [BlGroups, setBlGroups] = useState();

  const totalBlFourniture = produits => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const totalFourniture = group => {
    return group?.reduce((acc, item) => {
      const type = item?.bonLivraison?.type;

      if (type === "achats") {
        return acc + totalBlFourniture(item.produits);
      } else if (type === "retour") {
        return acc - totalBlFourniture(item.produits);
      }

      return acc; // si type inconnu
    }, 0);
  };
  const filteredOrders = numero => {
    const list = BlGroups?.filter(order => {
      return order.devisNumero === numero;
    });
    return list;
  };

  function calculateMarge(devis, totalFourniture) {
    const diff = devis.total - totalFourniture;
    if (totalFourniture === 0 || devis.statut === "En attente") {
      return "";
    } else if (totalFourniture > 0) {
      return formatMontant(diff);
    }
  }

  useEffect(() => {
    const storedData = localStorage.getItem("params");
    if (storedData) {
      setParams(JSON.parse(storedData));
      console.log("params", JSON.parse(storedData));
    }
  }, []);

  const devis = useQuery({
    queryKey: ["devis-impression", params],
    queryFn: async () => {
      const response = await axios.get("/api/devis/impression", {
        params,
      });
      setBlGroups(response.data.bLGroupsList);

      return response.data.devis;
    },
  });
  function statutPiementLabel(statut) {
    if (statut === "all") {
      return "Tous";
    } else if (statut === "paye") {
      return "Payé";
    } else if (statut === "impaye") {
      return "Impayé";
    } else if (statut === "enPartie") {
      return "En partie";
    }
  }

  const fromDay = new Date(params?.from);

  // Calcul des totaux
  const calculateTotals = () => {
    if (!devis?.data || devis.data.length === 0) {
      return {
        totalMontant: 0,
        totalFournitures: 0,
        totalMarge: 0,
        totalPaye: 0,
      };
    }

    const totals = devis.data.reduce(
      (acc, devis) => {
        const fourniture = totalFourniture(filteredOrders(devis.numero));
        const marge =
          devis.statut === "En attente" || fourniture === 0
            ? 0
            : (devis.total || 0) - (fourniture || 0);

        return {
          totalMontant: acc.totalMontant + (devis.total || 0),
          totalFournitures: acc.totalFournitures + (fourniture || 0),
          totalMarge: acc.totalMarge + marge,
          totalPaye: acc.totalPaye + (devis.totalPaye || 0),
        };
      },
      { totalMontant: 0, totalFournitures: 0, totalMarge: 0, totalPaye: 0 }
    );

    return totals;
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Devis
              </h3>
              <div className="grid grid-cols-3 items-center mb-4">
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Période :
                  </h3>
                  {params?.form && params?.to ? (
                    <p className="text-sm text-gray-600">
                      {`${fromDay.getDate()}-${
                        fromDay.getMonth() + 1
                      }-${fromDay.getFullYear()}`}{" "}
                      • {formatDate(params?.to)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Indéterminer</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Statut de paiement :
                  </h3>
                  <p className="text-sm text-gray-600">
                    {statutPiementLabel(params?.statutPaiement)}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Statut de devis:
                  </h3>
                  <p className="text-sm text-gray-600">
                    {params?.statut === "all" ? "Tous" : params?.statut}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Montant total:
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(params?.minTotal)} •{" "}
                    {formatCurrency(params?.maxTotal)}
                  </p>
                </div>
                {params?.query && (
                  <div className="flex gap-2 items-center">
                    <h3 className="mb-1 font-semibold text-gray-900">
                      Requête de recherche :
                    </h3>
                    <p className="text-sm text-gray-600">{params?.query}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant total</TableHead>
                    <TableHead className="text-right">Fournitures</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead className="text-left">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devis.isLoading ? (
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
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        {[...Array(9)].map((_, cellIndex) => (
                          <TableCell
                            key={cellIndex}
                            className="!py-2 text-sm md:text-base"
                            align="left"
                          >
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : devis?.data?.length > 0 ? (
                    <>
                      {devis?.data?.map((devis, index) => (
                        <>
                          <Fragment key={devis.id}>
                            <TableRow>
                              <TableCell className="!py-2">
                                {index + 1}
                              </TableCell>
                              <TableCell className="!py-2">
                                {formatDate(devis.date)}
                              </TableCell>
                              <TableCell className={`font-medium !py-2`}>
                                <div>
                                  <span className="mr-2">{devis.numero}</span>
                                </div>
                              </TableCell>
                              <TableCell className="!py-2">
                                {devis.client.nom.toUpperCase()}
                              </TableCell>
                              <TableCell className="!py-2  text-right">
                                {formatMontant(devis.total)}
                              </TableCell>
                              <TableCell className="!py-2 text-right">
                                {formatMontant(
                                  totalFourniture(filteredOrders(devis.numero))
                                )}
                              </TableCell>
                              <TableCell className="!py-2 text-right">
                                {calculateMarge(
                                  devis,
                                  totalFourniture(filteredOrders(devis.numero))
                                )}
                              </TableCell>
                              <TableCell className="!py-2 text-right">
                                {formatMontant(devis.totalPaye)}
                              </TableCell>

                              <TableCell className="!py-2 text-right">
                                {formatMontant(
                                  devis.total.toFixed(2) -
                                    devis.totalPaye.toFixed(2)
                                )}
                              </TableCell>
                              <TableCell className="!py-2 text-left">
                                {devis.statut}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        </>
                      ))}
                      <TableRow className="font-semibold bg-gray-50">
                        <TableCell className="!py-2" colSpan={4}>
                          <strong>TOTAL</strong>
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          <strong>{formatMontant(totals.totalMontant)}</strong>
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          <strong>
                            {formatMontant(totals.totalFournitures)}
                          </strong>
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          <strong>{formatMontant(totals.totalMarge)}</strong>
                        </TableCell>
                        <TableCell className="!py-2 text-right">
                          <strong>{formatMontant(totals.totalPaye)}</strong>
                        </TableCell>
                        <TableCell className="!py-2 text-right"></TableCell>
                        <TableCell className="!py-2 text-left"></TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
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
                          <p>Aucun devis trouvé</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end
print:hidden mt-5"
        >
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
