import { columns, Payment } from "./columns";
import { DataTable } from "./data-table";

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "1",
      date: "2023-10-01",
      numero: "BL001",
      fournisseur: { nom: "Fournisseur A" },
      total: 1500,
      totalPaye: 1000,
      reference: "REF001",
    },
    {
      id: "2",
      date: "2023-10-02",
      numero: "BL002",
      fournisseur: { nom: "Fournisseur B" },
      total: 25600,
      totalPaye: 1000,
      reference: "REF002",
    },
    {
      id: "3",
      date: "2023-10-03",
      numero: "BL003",
      fournisseur: { nom: "Fournisseur C" },
      total: 2500,
      totalPaye: 500,
      reference: "REF003",
    },
    {
      id: "4",
      date: "2023-10-04",
      numero: "BL004",
      fournisseur: { nom: "Fournisseur D" },
      total: 3000,
      totalPaye: 2200,
      reference: "REF004",
    },
  ];
}

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
