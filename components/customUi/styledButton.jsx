import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

function AddButton({ onClick, title , type }) {
  return (
    <Button
    type={type}
      onClick={onClick}
      className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 rounded-full hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform"
    >
      <Plus className="mr-2 h-4 w-4" />
      {title}
    </Button>
  );
}

function SaveButton({ title, type ,onClick , disabled }) {
  return (
    <Button
    disabled={disabled}
    onClick={onClick}
      type={type}
      className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md  font-bold transition-all duration-300 transform"
    >
      {title}
    </Button>
  );
}

function FilterButton() {
  return (
    <Button
      variant="outline"
      className="border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 rounded-full"
    >
      <Filter className="mr-2 h-4 w-4" />
      Filtres
    </Button>
  );
}

export { AddButton, SaveButton, FilterButton };
