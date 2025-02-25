// pages/404.js (or 404.tsx for TypeScript)
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function Custom404() {
  return (
    <div className="flex items-start justify-center h-screen w-full">
      <Card className="w-[600px] h-[300px] mt-10 flex flex-col items-center justify-center text-center rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-purple-500">Page introuvable</h1>
        <p className="text-lg text-gray-700 mt-4">
          La page que vous avez demandée est introuvable
        </p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 bg-purple-500 text-white rounded-full"
        >
          Retoure à la page d&apos;accueil
        </Link>
      </Card>
    </div>
  );
}
