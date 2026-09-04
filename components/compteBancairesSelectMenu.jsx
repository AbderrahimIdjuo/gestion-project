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
    <div className="flex flex-col gap-2">
      <Label htmlFor="compte-rapport" className="text-sm font-medium leading-none">
        Compte :
      </Label>
      <Select
        value={compte}
        name="compte"
        onValueChange={value => setCompte(value)}
      >
        <SelectTrigger
          id="compte-rapport"
          className="w-full bg-white focus:ring-2 focus:ring-purple-500"
        >
          <SelectValue placeholder="Séléctionner..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">Tous les comptes</div>
          </SelectItem>
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
