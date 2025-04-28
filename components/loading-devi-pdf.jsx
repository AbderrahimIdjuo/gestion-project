"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, MapPin, Smartphone, Calendar } from "lucide-react";

export default function LoadingDeviPdf() {
  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
      <div className="space-y-3">
        {/* Static Header */}
        <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
          <img src="/images/LOGO-tete.jpg" alt="Logo" width={300} />
          <img src="/images/LOGO-OUDAOUD.jpg" className="h-24 w-24" />
        </div>

        {/* Company and Client Info */}
        <div className="grid grid-cols-2 gap-8">
          {/* Company Info - Static elements remain */}
          <div className="col-span-1">
            <h1 className="font-bold text-lg text-gray-900">
              DEVIS N° : <Skeleton className="inline-block h-5 w-20" />
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="h-3 w-3" />
              <div className="flex gap-2 font-medium text-sm">
                Date de création: <Skeleton className="inline-block h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Client Info - Static elements remain */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-bold text-lg text-gray-900">Client : </h2>
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Items Table - Structure remains, content skeletons */}
        <div className="overflow-hidden rounded-md border border-black mt-0">
          <Table className="w-full border-collapse print:w-full print:min-w-full">
            <TableHeader className="text-[1rem] border-black">
              <TableRow>
                <TableHead rowSpan="2" className="w-[40%] max-w-[45%] text-black font-bold text-center border-b border-black">
                  Désignation
                </TableHead>
                <TableHead colSpan="2" className="text-black font-bold border-l border-b border-black text-center p-1">
                  Dimension
                </TableHead>
                <TableHead rowSpan="2" className="text-black font-bold border-l border-b border-black text-center p-1">
                  U
                </TableHead>
                <TableHead rowSpan="2" className="text-black font-bold border-l border-b border-black text-center p-1">
                  Qté
                </TableHead>
                <TableHead rowSpan="2" className="text-black font-bold border-l border-b border-black p-2 text-center p-1">
                  P.U/m²
                </TableHead>
                <TableHead rowSpan="2" className="text-black font-bold border-l border-b border-black p-2 text-center">
                  Montant
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-black font-semibold text-center border-b border-l border-black p-1">
                  Longueur
                </TableHead>
                <TableHead className="text-black font-semibold border-l border-b border-black text-center p-1">
                  Largeur
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="p-1 text-left border-b border-black text-md font-semibold">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center">
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center">
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center">
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center">
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center">
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-1 text-center font-bold">
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="font-medium border-black bg-[#228b8b1d]">
              <TableRow>
                <TableCell colSpan={6} className="border-b border-black p-2 text-right font-bold">
                  Total H.T :
                </TableCell>
                <TableCell colSpan={2} className="border-l border-b border-black p-2 text-left font-bold">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={6} className="border-b border-black p-2 text-right font-bold">
                  TVA :
                </TableCell>
                <TableCell colSpan={2} className="border-l border-b border-black p-2 text-left font-bold">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={6} className="text-lg text-gray-900 p-2 text-right font-extrabold">
                  Total TTC :
                </TableCell>
                <TableCell colSpan={2} className="border-l border-black p-2 text-lg text-gray-900 text-left font-extrabold">
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Static content with loading placeholders */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium mb-0">
            Arrêter le devis à : <Skeleton className="inline-block h-4 w-48" />
          </h3>
          <h3 className="text-sm font-medium mb-0">
            Validité du devis : 30 jours
          </h3>
          <div className="print-block">
            <h3 className="text-sm font-medium mb-0">Modes de paiements :</h3>
            <div className="flex justify-center">
              <div className="w-[70%] overflow-hidden rounded-md border border-black my-auto">
                <Table className="w-full border-collapse">
                  <TableHeader className="text-[1rem] border-black">
                    <TableRow>
                      <TableHead className="text-sm text-black font-medium text-center p-0">
                        Paiements
                      </TableHead>
                      <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                        Montant H.T
                      </TableHead>
                      <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                        TVA 20%
                      </TableHead>
                      <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                        Montant TTC
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="p-1 text-center border-b text-md font-semibold p-0">
                          <Skeleton className="h-5 w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="border-l border-b p-1 text-center p-0">
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="border-l border-b p-1 text-center p-0">
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="border-l border-b p-1 text-center p-0">
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-0 italic underline">
              En signant ce devis, le client confirme son accord et valide
              une commande ferme et définitive.
            </h3>
          </div>
          <div
            className="print-footer"
            style={{
              backgroundColor: "#228B8B",
              padding: "10px",
              textAlign: "center",
              color: "white",
              fontFamily: '"Times New Roman", serif',
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "medium" }}>
              STE OUDAOUDOX SARL AU Au Capital : 500 000 DH - Avenue Jaber
              Ben Hayane Bloc A N°01 Hay El Houda - Agadir
            </div>
            <div style={{ marginTop: "5px", fontSize: "13px" }}>
              Gsm : 06 61 58 53 08 - 06 63 63 72 44 - E-mail :
              inoxoudaoud@gmail.com
            </div>
            <hr
              style={{
                width: "40%",
                margin: "5px auto",
                border: "0.5px solid white",
              }}
            />
            <div style={{ fontSize: "13px" }}>
              RC : 53805 - TP : 67504461 - IF : 53290482 - ICE :
              003172063000061
            </div>
          </div>
        </div>
      </div>
      <div className="print:hidden mt-8 flex justify-end">
        <Button
          disabled
          className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 rounded-full hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform opacity-50"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
      </div>
    </div>
  );
}