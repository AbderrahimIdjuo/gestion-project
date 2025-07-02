import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 w-full">
      <div className="flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center py-1">
            <img src="/images/LOGO-tete.jpg" alt="Logo" width={250} />
          </div>
        </Link>
        {/* <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div> */}
      </div>
    </nav>
  );
}
