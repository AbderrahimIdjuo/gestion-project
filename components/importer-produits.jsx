"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Upload, FileText, File } from "lucide-react";

export default function ImportProduits({ children }) {
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState(""); // State to store the file name

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileName(e.target.files[0].name);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import-produits", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error uploading file");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importer des produits </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4">
              <div className="relative flex-1 w-full">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  id="file-upload"
                />
                <div className="flex items-center gap-2 p-2 border rounded-md bg-background text-sm">
                  {fileName ? (
                    <>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="truncate">{fileName}</span>{" "}
                    </>
                  ) : (
                    <>
                      <File className="h-5 w-5 text-muted-foreground" />
                      <span className="truncate">
                        Choisir un fichier
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Button
                className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                onClick={handleUpload}
                disabled={!file}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
