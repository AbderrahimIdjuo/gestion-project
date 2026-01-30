"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
    ArrowUp,
    ChevronDown,
    ChevronRight,
    ContactRound,
    FileText,
    Files,
    Grid2X2,
    Landmark,
    LayoutDashboard,
    Package,
    ReceiptText,
    Ruler,
    ScrollText,
    Settings,
    Truck,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menuItems = [
  //  { icon: TestTubeDiagonal, label: "Test", href: "/test" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Users,
    label: "Clients",
    href: "/clients",
  },
  { icon: Users, label: "Fournisseurs", href: "/achats/fournisseurs" },
  {
    icon: Package,
    label: "Produits",
    href: "/produits",
  },
  {
    icon: Grid2X2,
    label: "Articls",
    href: "/articls",
  },
  { icon: FileText, label: "Devis", href: "/ventes/devis" },
  { icon: Files, label: "Factures Ventes", href: "/ventes/factures" },
  { icon: Truck, label: "Commandes", href: "/achats/commandes" },
  { icon: ScrollText, label: "BL", href: "/achats/bonLivraison" },
  {
    icon: ContactRound,
    label: "Employés",
    href: "/Employes",
  },

  // {
  //   icon: ShoppingCart,
  //   label: "Commandes clients",
  //   href: "/ventes/commandes",
  // },
  // {
  //   icon: ShoppingCart,
  //   label: "Ventes",
  //   href: "/ventes",
  //   subItems: [
  //     { label: "Devis", href: "/ventes/devis" },
  //     { label: "Commandes", href: "/ventes/commandes" },
  //   ],
  // },
  {
    icon: Landmark,
    label: "Transactions",
    href: "/transactions",
  },
  {
    icon: ReceiptText,
    label: "Règlement",
    href: "/reglement",
  },
  {
    icon: ArrowUp,
    label: "Versements compte pro",
    href: "/versements",
  },
  {
    icon: FileText,
    label: "Factures Achats",
    href: "/facturesAchats",
  },
  {
    icon: Ruler,
    label: "Débitage",
    href: "/debitage",
    subItems: [
      {
        label: "Marbre",
        href: "/debitage/marbre",
      },
      {
        label: "Verre",
        href: "/debitage/verre",
      },
    ],
  },
  {
    icon: Settings,
    label: "Paramètres",
    href: "/parametres",
    subItems: [
      // {
      //   label: "Info de l'entreprise",
      //   href: "/parametres/infoEntreprise",
      // },
      {
        label: "Catégories des produits",
        href: "/parametres/categories",
      },
      {
        label: "Charges récurrentes",
        href: "/parametres/charges",
      },
      { label: "Comptes bancaires", href: "/parametres/banques" },
      { label: "Modes de paiement", href: "/parametres/modesPaiement" },
      { label: "Type de tâches", href: "/parametres/typeTaches" },
      { label: "Utilisateurs", href: "/parametres/users-management" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState(["produits", "achats", "ventes"]);
  const { user } = useUser();

  const toggleMenu = href => {
    setOpenMenus(current =>
      current.includes(href)
        ? current.filter(item => item !== href)
        : [...current, href]
    );
  };

  const isActive = href => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isSubActive = href => {
    return pathname === href;
  };

  // Filtrer les éléments du menu en fonction du rôle de l'utilisateur
  const getFilteredMenuItems = () => {
    // Masquer toute la section Paramètres pour les non-admins
    const role = user?.publicMetadata?.role;
    const isAdmin = role === "admin";

    return menuItems
      .filter(item => {
        if (item.href === "/parametres") {
          return isAdmin;
        }
        if (item.href === "/Employes") {
          return isAdmin;
        }
        return true;
      })
      .map(item => {
      if (item.subItems) {
        // Filtrer les sous-éléments pour les paramètres
        const filteredSubItems = item.subItems.filter(subItem => {
          // Masquer "Utilisateurs" si l'utilisateur n'est pas admin
          if (subItem.href === "/parametres/users-management") {
            return isAdmin;
          }
          return true;
        });

        return {
          ...item,
          subItems: filteredSubItems,
        };
      }
      return item;
    });
  };

  const filteredMenuItems = getFilteredMenuItems();

  return (
    <div
      className={`h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out caret-transparent ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="h-full overflow-y-auto">
        <ul className="space-y-1 p-2">
          {filteredMenuItems.map((item, index) => {
            const isMenuActive = isActive(item.href);
            const isOpen = openMenus.includes(item.href);
            const Icon = item.icon;

            return (
              <li key={index}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer",
                    isMenuActive
                      ? "bg-purple-100 text-purple-600"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    if (item.subItems) {
                      toggleMenu(item.href);
                    } else {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-[2rem]">
                    <div
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-300 ease-in-out",
                        isMenuActive ? "bg-purple-100" : ""
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isMenuActive ? "text-purple-600" : ""
                        )}
                      />
                    </div>
                    <span
                      className={`transition-all duration-300 ease-in-out ${
                        isExpanded
                          ? "opacity-100 max-w-full"
                          : "opacity-0 max-w-0 overflow-hidden"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.subItems && (
                    <div
                      className={`ml-auto transition-opacity duration-300 ease-in-out ${
                        isExpanded ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isMenuActive ? "text-purple-600" : ""
                          )}
                        />
                      ) : (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isMenuActive ? "text-purple-600" : ""
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && item.subItems && isOpen && (
                  <ul className="ml-1 w-full mt-1 space-y-1">
                    {item.subItems.map(subItem => {
                      const isSubItemActive = isSubActive(subItem.href);

                      return (
                        <li
                          key={subItem.href}
                          className="flex items-center justify-between"
                        >
                          <Link
                            href={subItem.href}
                            className={cn(
                              "block px-3 py-2 rounded-xl transition-colors flex-grow",
                              isSubItemActive
                                ? "bg-purple-100 text-purple-600"
                                : "text-slate-500 hover:bg-slate-100"
                            )}
                            prefetch={true}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
