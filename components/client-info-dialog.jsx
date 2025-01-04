"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export function ClientInfoDialog({ client, children }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-hidden p-0">
        <Card className="border-0">
          <CardHeader className="p-0">
            <div className="relative bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 h-28">
              {/* Decorative wave element */}
              <h1 className="pt-6 pl-3 text-3xl text-center font-bold text-white">
                {client.nom.toUpperCase()}
              </h1>
              <div className="absolute bottom-0 left-0 right-0">
                <svg
                  viewBox="0 0 1440 120"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-12 fill-white"
                  preserveAspectRatio="none"
                >
                  <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-6 mt-6">
              {/* <div className="flex flex-col items-center text-center mb-6">
                <h1 className="mt-4 text-2xl font-bold text-white">{client.nom.toUpperCase()}</h1>
              </div> */}

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 hover:text-violet-600 transition-colors">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{client.telephone}</p>
                </div>
                <div className="flex items-center gap-3 text-gray-600 hover:text-violet-600 transition-colors">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{client.adresse}</p>
                </div>
                <div className="flex items-center gap-3 text-gray-600 hover:text-violet-600 transition-colors">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{client.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
