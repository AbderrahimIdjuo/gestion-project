"use client";

import { client, columns } from "./columns";
import { DataTable } from "./data-table";

// Mock data
const commandes = Array.from({ length: 50 }, (_, i) => ({
  id: `CMD-${(i + 1).toString().padStart(4, "0")}`,
  client: `Client ${i + 1}`,
  date: new Date(2024, 0, i + 1).toLocaleDateString("fr-FR"),
  montant: Math.floor(Math.random() * 10000) + 100,
  statut: ["En cours", "Expédiée", "Livrée", "Annulée"][i % 4],
}));

export default function CommandesPage() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={commandes} />
    </div>
  );
}
