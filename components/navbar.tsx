"use client";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 w-full">
      <div className="flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center py-1">
            <Image
              src="/images/LOGO-tete.jpg"
              alt="Logo"
              width={250}
              height={70}
            />{" "}
          </div>
        </Link>
      </div>
    </nav>
  );
}
