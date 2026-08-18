"use client";
import { formatCurrency } from "@/lib/functions";

function soldeColor(solde) {
  if (solde > 0) return "text-green-600";
  if (solde < 0) return "text-rose-600";
  return "";
}

export default function TransactionsTypeTotalsHeader({ totals }) {
  const t = totals || {
    totalRecettes: 0,
    totalDepenses: 0,
    totalVider: 0,
    totalTransferts: 0,
    total: 0,
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
      <div className="grid grid-cols-5 gap-4 text-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Total Des Recettes
          </h3>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(t.totalRecettes)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Total Des Dépenses
          </h3>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(t.totalDepenses)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Total Vider la caisse
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(t.totalVider)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Total Des Transferts
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(t.totalTransferts)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Total</h3>
          <p className={`text-lg font-bold ${soldeColor(t.total)}`}>
            {formatCurrency(t.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
