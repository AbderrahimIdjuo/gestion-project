"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pen } from "lucide-react";
import { LoadingDots } from "@/components/loading-dots";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";

export function LogoManager({ logoUrl , setImageUrl }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  //const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  // Fetch the logo on component mount
  //   useEffect(() => {
  //     const fetchLogo = async () => {
  //       try {
  //         const response = await fetch("/api/infoEntreprise");
  //         if (!response.ok) {
  //           throw new Error("Failed to fetch logo");
  //         }
  //         const data = await response.json();
  //         setLogoUrl(data.infoEntreprise[0].logoUrl);
  //       } catch (error) {
  //         console.error("Error fetching logo:", error);
  //         setError("Failed to fetch logo");
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     fetchLogo();
  //   }, []);

  // Upload the file automatically when it changes
  useEffect(() => {
    if (file) {
      handleSubmit();
    }
  }, [file]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/importLogo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      setImageUrl(result.url)
      //setLogoUrl(result.url); // Update the displayed logo
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file");
    } finally {
      setUploading(false);
      //queryClient.invalidateQueries({ queryKey: ["infoEntreprise"] });
    }
  };

  if (loading) {
    return <LoadingDots />;
  }

  return (
    <div>
      <div className="relative group w-fit">
        {/* Avatar */}
        <div className="relative w-24 h-24 group">
          <Avatar
            onClick={() => fileRef.current.click()}
            className="w-24 h-24 shadow-md border cursor-pointer transition-all duration-300 group-hover:blur-sm"
          >
            <AvatarImage src={logoUrl} />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar>

          <Button
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
            onClick={() => fileRef.current.click()}
          >
            {logoUrl ? (
              <Pen className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
        <div className="flex justify-center my-3">
          {uploading && <LoadingDots />}
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
