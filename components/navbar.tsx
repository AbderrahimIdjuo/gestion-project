"use client";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  const { isSignedIn, user } = useUser();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 w-full shadow-sm">
      <div className="flex justify-between items-center ">
        {/* Logo OUDAOUDOX */}
        <Link href="/">
          <div className="flex items-center py-1">
            <Image
              src="/images/LOGO-tete.jpg"
              alt="Logo OUDAOUDOX"
              width={200}
              height={50}
              className="transition-all duration-300 ease-in-out hover:scale-105"
            />
          </div>
        </Link>

        {/* Navigation et contrôles utilisateur */}
        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              {/* Role-based navigation links */}
              {user?.publicMetadata?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-blue-50"
                >
                  Administration
                </Link>
              )}

              {user?.publicMetadata?.role === "commercant" && (
                <Link
                  href="/commercant"
                  className="text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-blue-50"
                >
                  Espace Commercial
                </Link>
              )}

              {/* User button with dropdown */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 hidden md:block">
                  {user?.firstName || "Utilisateur"}
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8",
                      userButtonPopoverCard: "shadow-lg border border-gray-200",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="px-4 py-1.5">
                  Connexion
                </Button>
              </SignInButton>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  Inscription
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
