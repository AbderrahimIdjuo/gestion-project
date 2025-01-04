"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Users,
    label: "Clients",
    href: "/clients",
  },
  {
    icon: Package,
    label: "Produits",
    href: "/produits",
  },
  {
    icon: ShoppingCart,
    label: "Ventes",
    href: "/ventes",
    subItems: [
      { label: "Devis", href: "/ventes/devis" },
      { label: "Commandes", href: "/ventes/commandes" },
      { label: "Crédit de clients", href: "/ventes/credit-clients" },
    ],
  },
  {
    icon: Truck,
    label: "Achats",
    href: "/achats",
    subItems: [
      {
        label: "Fournisseurs",
        href: "/achats/fournisseurs",
      },
      { label: "Dépenses", href: "/achats/depenses" },
      { label: "Dépenses récurrentes", href: "/achats/depenses-recurrentes" },
      {
        label: "Factures",
        href: "/achats/factures",
      },
      { label: "Crédit fournisseurs", href: "/achats/credit-fournisseurs" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState(["produits", "achats", "ventes"]);

  const toggleMenu = (href) => {
    setOpenMenus((current) =>
      current.includes(href)
        ? current.filter((item) => item !== href)
        : [...current, href]
    );
  };

  const isActive = (href) => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isSubActive = (href) => {
    return pathname === href;
  };

  return (
    <div
      className={`h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="h-full overflow-y-auto">
        <ul className="space-y-1 p-2">
          {menuItems.map((item, index) => {
            const isMenuActive = isActive(item.href);
            const isOpen = openMenus.includes(item.href);
            const Icon = item.icon;

            return (
              <li key={index}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-full transition-all duration-300 ease-in-out cursor-pointer",
                    isMenuActive
                      ? "bg-purple-100 text-purple-600"
                      : "text-muted-foreground hover:bg-muted"
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
                        "w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 ease-in-out",
                        isMenuActive ? "bg-purple-100" : ""
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
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
                  <ul className="ml-12 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubItemActive = isSubActive(subItem.href);

                      return (
                        <li
                          key={subItem.href}
                          className="flex items-center justify-between"
                        >
                          <Link
                            href={subItem.href}
                            className={cn(
                              "block px-3 py-2 rounded-full transition-colors flex-grow",
                              isSubItemActive
                                ? "bg-purple-100 text-purple-600"
                                : "text-muted-foreground hover:bg-muted"
                            )}
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
