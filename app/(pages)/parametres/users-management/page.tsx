"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Pen, Plus, Trash2 } from "lucide-react";
import { ChangeEvent, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  derniereConnexion: string | null;
};

type UserFormData = {
  nom: string;
  email: string;
  role: string;
};

export default function UsersManagement() {
  const [formData, setFormData] = useState<UserFormData>({
    nom: "",
    email: "",
    role: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [addUserDialog, setAddUserDialog] = useState<boolean>(false);

  const getUsers = async () => {
    const response = await axios.get("/api/users");
    console.log("users :", response.data);

    return response.data;
  };

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const addUser = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const loadingToast = toast.loading("Ajout de l'utilisateur...");
      try {
        await axios.post("/api/users", userData);
        toast.success("Utilisateur ajouté avec succès");
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setFormData({ nom: "", email: "", role: "" });
      setAddUserDialog(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      userId,
      nom,
      email,
      role,
      active,
    }: {
      userId: string;
      nom?: string;
      email?: string;
      role?: string;
      active?: boolean;
    }) => {
      const loadingToast = toast.loading("Modification de l'utilisateur...");
      try {
        await axios.put("/api/users", { userId, nom, email, role, active });
        toast.success("Utilisateur modifié avec succès");
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Échec de la modification!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setFormData({ nom: "", email: "", role: "" });
      setAddUserDialog(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (user: User) => {
      console.log("# user #:", user);
      const loadingToast = toast.loading("Suppression de l'utilisateur...");
      try {
        await axios.delete("/api/users", { data: { userId: user.id } });
        toast(
          <span>
            <b>{user?.nom.toUpperCase()}</b> est supprimé!
          </span>,
          {
            icon: "🗑️",
          }
        );
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Échec de la suppression");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser.mutate({
        userId: editingUser.id,
        nom: formData.nom,
        email: formData.email,
        role: formData.role,
      });
    } else {
      addUser.mutate(formData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      role: user.role,
    });
    setAddUserDialog(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({ nom: "", email: "", role: "" });
    setAddUserDialog(false);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ nom: "", email: "", role: "" });
    setAddUserDialog(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialog(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen">
        {/* Navbar - prend toute la largeur */}
        <Navbar />

        {/* Container principal avec sidebar et contenu */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Page content */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">
                    Gestion des utilisateurs
                  </h1>
                  <Button
                    onClick={handleAddUser}
                    className="bg-emerald-400 hover:bg-emerald-500 rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un utilisateur
                  </Button>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <div className="hidden md:block">
                    <SittingsSideBar page={"users-management"} />
                  </div>

                  <div className="w-full col-span-1 sm:col-span-2 md:col-span-3">
                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Dernière connexion</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {query.isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">
                                Loading ...
                              </TableCell>
                            </TableRow>
                          ) : query.data?.length > 0 ? (
                            query.data?.map((user: User) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.nom}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.role === "admin"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.actif
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {user.actif ? "Actif" : "Inactif"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {formatDate(user.derniereConnexion)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => handleEdit(user)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                    >
                                      <Pen className="h-4 w-4" />
                                      <span className="sr-only">Modifier</span>
                                    </Button>
                                    <Button
                                      onClick={() => handleDelete(user)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Supprimer</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">
                                Aucun utilisateur trouvé
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog
        recordName={userToDelete?.nom}
        isOpen={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setUserToDelete(null);
        }}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser.mutate(userToDelete);
            setDeleteDialog(false);
            setUserToDelete(null);
          }
        }}
      />

      {/* Add/Edit User Dialog */}
      <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser
                ? "Modifier l'utilisateur"
                : "Ajouter un utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Nom..."
                  value={formData.nom}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="rounded-full bg-gray-50 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                  spellCheck={false}
                  disabled={editingUser !== null}
                />
              </div>
              <div>
                <Input
                  placeholder="Email..."
                  type="email"
                  value={formData.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-full bg-gray-50 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                  spellCheck={false}
                  disabled={editingUser !== null}
                />
              </div>
              <div>
                <Select
                  value={formData.role}
                  onValueChange={value =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="rounded-full bg-gray-50 focus-visible:ring-emerald-500 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Rôle..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="commercant">Commerçant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                className="bg-emerald-400 hover:bg-emerald-500 rounded-full"
                disabled={!formData.nom || !formData.email || !formData.role}
                type="submit"
              >
                {editingUser ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
