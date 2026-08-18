"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { useState } from "react";

const hoverClasses = {
  purple: "hover:!bg-purple-100",
  red: "hover:!bg-red-100",
  blue: "hover:!bg-blue-100",
  sky: "hover:!bg-blue-100",
  amber: "hover:!bg-amber-100",
  green: "hover:!bg-green-100",
  emerald: "hover:!bg-emerald-100",
  fuchsia: "hover:!bg-fuchsia-100",
};

const iconClasses = {
  purple: "text-purple-600",
  red: "text-red-600",
  blue: "text-sky-600",
  sky: "text-sky-600",
  amber: "text-amber-600",
  green: "text-green-600",
  emerald: "text-emerald-600",
  fuchsia: "text-fuchsia-600",
};

const textHoverClasses = {
  purple: "group-hover:text-purple-600 group-hover:bg-purple-100",
  red: "group-hover:text-red-600 group-hover:bg-red-100",
  blue: "group-hover:text-blue-600 group-hover:bg-blue-100",
  sky: "group-hover:text-blue-600 group-hover:bg-blue-100",
  amber: "group-hover:text-amber-600 group-hover:bg-amber-100",
  green: "group-hover:text-green-600 group-hover:bg-green-100",
  emerald: "group-hover:text-emerald-600 group-hover:bg-emerald-100",
  fuchsia: "group-hover:text-fuchsia-600 group-hover:bg-fuchsia-100",
};

export function TableRowActionItem({
  icon: Icon,
  label,
  onClick,
  color = "purple",
}) {
  return (
    <DropdownMenuItem
      onClick={e => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`flex items-center gap-2 cursor-pointer group ${hoverClasses[color] || hoverClasses.purple}`}
    >
      {Icon && (
        <Icon
          className={`h-4 w-4 ${iconClasses[color] || iconClasses.purple}`}
        />
      )}
      <span
        className={`transition-colors duration-200 ${textHoverClasses[color] || textHoverClasses.purple}`}
      >
        {label}
      </span>
    </DropdownMenuItem>
  );
}

export function TableRowActions({
  items = [],
  children,
  className = "w-56 rounded-md",
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={className}>
          {items
            .filter(item => !item.hidden)
            .map((item, index) => (
              <TableRowActionItem
                key={`${item.label}-${index}`}
                icon={item.icon}
                label={item.label}
                color={item.color}
                onClick={() => {
                  item.onClick?.();
                  setMenuOpen(false);
                }}
              />
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {children}
    </>
  );
}
