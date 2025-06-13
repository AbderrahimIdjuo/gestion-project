"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export default function CompteBancairesSelectMenu({ compte, setCompte }) {
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });
  return (
    <div className="space-y-2">
      <Label htmlFor="orderNumber">Compte :</Label>
      <Select
        value={compte}
        name="compte"
        onValueChange={(value) => setCompte(value)}
      >
        <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
          <SelectValue placeholder="Séléctionner..." />
        </SelectTrigger>
        <SelectContent>
          {comptes.data?.map((element) => (
            <SelectItem key={element.id} value={element.compte}>
              <div className="flex items-center gap-2">{element.compte}</div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
