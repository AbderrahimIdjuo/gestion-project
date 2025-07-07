"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function CategoriesSelectMenu({ categorie, setCategorie }) {
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });
  return (
    <Select value={categorie} onValueChange={(value) => setCategorie(value)}>
      <SelectTrigger className="col-span-3  bg-white focus:ring-purple-500">
        <SelectValue placeholder="Sélectionner ..." />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {categories.data?.map((element) => (
          <SelectItem key={element.id} value={element.categorie}>
            {element.categorie}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
