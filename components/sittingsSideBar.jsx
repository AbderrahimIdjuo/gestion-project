import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavItem from "@/components/customUi/customNavItem";
import { Info, Landmark, Tags, List, CircleDollarSign } from "lucide-react";
function SittingsSideBar({ page }) {
  return (
    <>
      {/* the Sittings sideBar */}
      <div className="flex w-64 flex-col bg-white py-4 shadow-lg rounded-lg">
        <div className="mb-8 flex flex-col items-center space-y-2">
          <Avatar className="w-16 h-16">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>OD</AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold text-orange-400">
            OUDAOUDOX
          </span>
        </div>

        <nav className="space-y-1">
          <Link href="/parametres/infoEntreprise">
            <NavItem
              icon={<Info className="h-4 w-4" />}
              label="Informations"
              isActive={page === "infoEntreprise"}
            />
          </Link>
          <Link href="/parametres/categories">
            <NavItem
              icon={<Tags className="h-4 w-4" />}
              label="Catégorie des produits"
              isActive={page === "categories"}
            />
          </Link>
          <Link href="/parametres/banques">
            <NavItem
              icon={<Landmark className="h-4 w-4" />}
              label="Comptes Bancaires"
              isActive={page === "banques"}
            />
          </Link>
          <Link href="/parametres/modesPaiement">
            <NavItem
              icon={<CircleDollarSign className="h-4 w-4" />}
              label="Modes de paiement"
              isActive={page === "modesPaiement"}
            />
          </Link>
          <Link href="/parametres/typeTaches">
            <NavItem
              icon={<List className="h-4 w-4" />}
              label="Type de tâches"
              isActive={page === "typeTaches"}
            />
          </Link>
        </nav>
      </div>
    </>
  );
}

export default SittingsSideBar;
