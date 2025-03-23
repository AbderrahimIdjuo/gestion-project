import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload the file to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public", // Make the file publicly accessible
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
