import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth-utils";

// Create Clerk client instance
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// GET - Récupérer tous les utilisateurs (accessible à tous les utilisateurs authentifiés, ex. pour afficher les noms sur la page devis)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

    const mappedUsers = users
      // Garder seulement les utilisateurs avec un rôle défini
      .filter(
        u =>
          typeof u.publicMetadata?.role === "string" &&
          u.publicMetadata.role.trim() !== ""
      )
      .map(u => ({
        id: u.id,
        nom: u.firstName,
        email: u.emailAddresses[0]?.emailAddress,
        role: u.publicMetadata.role,
        actif: u.publicMetadata?.active ?? true,
        derniereConnexion: u.lastSignInAt || null,
        emailAddress: u.emailAddresses,
      }));

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(req) {
  try {
    await requireAdmin();
    const { nom, email, role } = await req.json();

    console.log("POST request received", nom, email, role);

    // Check if user with this email already exists
    try {
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });

      if (existingUsers.data.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cette adresse email est déjà utilisée. Veuillez en choisir une autre.",
          },
          { status: 409 }
        );
      }
    } catch (checkError) {
      // If check fails, continue with creation attempt
      console.log("Could not check existing users:", checkError.message);
    }

    const user = await clerkClient.users.createUser({
      firstName: nom,
      emailAddress: [email],
      publicMetadata: { role, active: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nom: user.firstName,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata.role,
        actif: user.publicMetadata?.active ?? true,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'utilisateur:",
      JSON.stringify(error, null, 2)
    );

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    // Handle specific Clerk errors
    if (error.clerkError && error.errors && error.errors.length > 0) {
      const clerkError = error.errors[0];
      if (clerkError.code === "form_identifier_exists") {
        return NextResponse.json(
          {
            error:
              "Cette adresse email est déjà utilisée. Veuillez en choisir une autre.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un utilisateur existant
export async function PUT(req) {
  try {
    await requireAdmin();
    const { userId, email, role, active } = await req.json();
    console.log(userId, email, role);
    // Validation des données
    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Validation du rôle si fourni
    if (role && !["admin", "commercant"].includes(role)) {
      return NextResponse.json(
        { error: "Le rôle doit être 'admin' ou 'commercant'" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur actuel pour fusionner les données
    const user = await clerkClient.users.getUser(userId);

    const updatedUser = await clerkClient.users.updateUser(userId, {
      ...(email !== undefined && { emailAddress: [email] }), // mettre à jour l'email si fourni
      publicMetadata: {
        ...user.publicMetadata, // garder les valeurs existantes
        ...(role !== undefined && { role }), // mettre à jour seulement si fourni
        ...(active !== undefined && { active }), // mettre à jour seulement si fourni
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        nom: updatedUser.firstName,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        role: updatedUser.publicMetadata.role,
        actif: updatedUser.publicMetadata?.active ?? true,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur:", error);

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error.message || "Erreur lors de la modification de l'utilisateur",
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(req) {
  try {
    await requireAdmin();
    const { userId } = await req.json();

    // Validation des données
    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    await clerkClient.users.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);

    if (error?.message?.includes("Access denied")) {
      return NextResponse.json(
        { error: "Accès refusé. Rôle admin requis." },
        { status: 403 }
      );
    }

    if (error?.message?.includes("Authentication required")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error.message || "Erreur lors de la suppression de l'utilisateur",
      },
      { status: 500 }
    );
  }
}
