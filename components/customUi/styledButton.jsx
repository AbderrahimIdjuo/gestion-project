import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function AddButton({ title }) {
  return (
    <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform">
      <Plus className="mr-2 h-4 w-4" />
      {title}
    </Button>
  );
}

function SaveButton({ title , type }) {
  return (
    <Button type={type} className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-black  font-semibold transition-all duration-300 transform">
      {title}
    </Button>
  );
}

export { AddButton, SaveButton };
