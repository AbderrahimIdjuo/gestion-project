"use client"

import { cn } from "@/lib/utils";

  interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
  }

  export default function NavItem({ icon, label, isActive }: NavItemProps) {
    return (
      <button
        className={cn(
          "group relative flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-slate-500 text-sm font-medium transition-all",
          " hover:text-orange-500 hover:before:rounded-r-md hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:h-full hover:before:w-1 hover:before:bg-orange-500",
          isActive &&
            "text-emerald-500 before:rounded-r-md before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-emerald-500"
        )}
      >
        {icon}
        {label}
      </button>
    );
  }