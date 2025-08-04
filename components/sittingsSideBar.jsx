import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavItem from "@/components/customUi/customNavItem";
import { Info, Landmark, Tags, List, CircleDollarSign , TrendingDown} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function SittingsSideBar({ page }) {
  const getInfoEntreprise = async () => {
    const response = await axios.get("/api/infoEntreprise");
    const infoEntreprise = response.data.infoEntreprise;
    return infoEntreprise;
  };

  const query = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: getInfoEntreprise,
  });
  return (
    <>
      {/* the Sittings sideBar */}
      <div className="flex w-64 flex-col bg-white py-4 shadow-lg rounded-lg">
        <div className="mb-8 flex flex-col items-center space-y-2">
          <Avatar className="w-16 h-16 shadow-md">
            <AvatarImage src={query.data?.logoUrl} />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold text-orange-400">
            {query.data?.[0]?.nom?.toUpperCase()}
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
             <Link href="/parametres/charges">
            <NavItem
              icon={<TrendingDown className="h-4 w-4" />}
              label="Charges récurrentes"
              isActive={page === "charges"}
            />
          </Link>
        </nav>
      </div>
    </>
  );
}

export default SittingsSideBar;
