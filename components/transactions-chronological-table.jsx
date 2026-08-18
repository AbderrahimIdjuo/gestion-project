"use client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
  sortTransactionsByDate,
  typeLabel,
} from "@/lib/functions";

function methodeLabel(methodePaiement) {
  if (methodePaiement === "espece") return "Espèce";
  if (methodePaiement === "cheque") return "Chèque";
  if (methodePaiement === "versement") return "Versement";
  if (methodePaiement === "traite") return "Traite";
  return methodePaiement || "";
}

export default function TransactionsChronologicalTable({
  transactions,
  isLoading = false,
  totals,
  footerClassName = "bg-gray-50",
}) {
  const sorted = sortTransactionsByDate(transactions);

  return (
    <div className="rounded-lg border overflow-x-auto mb-3">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="border-r border-b">Date</TableHead>
            <TableHead className="border-r border-b">Label</TableHead>
            <TableHead className="text-right border-r border-b">
              Montant
            </TableHead>
            <TableHead className="border-r border-b">Type</TableHead>
            <TableHead className="border-r border-b">Méthode</TableHead>
            <TableHead className="border-r border-b">Compte</TableHead>
            <TableHead className="border-b">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(10)].map((_, index) => (
              <TableRow key={index} className="h-[2rem]">
                {[...Array(7)].map((__, cellIndex) => (
                  <TableCell key={cellIndex} className="!py-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sorted.length > 0 ? (
            sorted.map(t => (
              <TableRow key={t.id} className="border-b">
                <TableCell className="px-1 py-2 border-r">
                  {formatDate(t.date) || formatDate(t.createdAt)}
                </TableCell>
                <TableCell className="px-1 py-2 border-r">
                  {t.type === "vider" ? "Vider la caisse" : t.lable}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 border-r">
                  {formatCurrency(t.montant)}
                </TableCell>
                <TableCell className="px-1 py-2 border-r">
                  {typeLabel(t.type)}
                </TableCell>
                <TableCell className="px-1 py-2 border-r">
                  {methodeLabel(t.methodePaiement)}
                </TableCell>
                <TableCell className="px-1 py-2 border-r">
                  {t.type === "vider"
                    ? "caisse"
                    : t.compte?.replace("compte", "")}
                </TableCell>
                <TableCell className="px-1 py-2">
                  {(t.description || "").replace(
                    "paiement du fournisseur",
                    "Bénéficiaire : "
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Aucune transaction trouvée
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter className={footerClassName}>
          <TableRow className="border-b">
            <TableCell
              colSpan={6}
              className="text-right text-lg font-semibold p-2 border-r"
            >
              Total :
            </TableCell>
            <TableCell className="text-left text-lg font-semibold p-2">
              {formatCurrency(totals?.total || 0)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
