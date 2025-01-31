import { z } from "zod";

// Helper validation functions (ensure they return the value or throw errors)
const validateInt = (value) => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    // throw new Error("The value must be an integer.");
    return false;
  }
  return parsed;
};

const validateFloat = (value) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    // throw new Error("The value must be a float.");
    return false;
  }
  return parsed;
};
// Product schema for individual items

const productSchema = z.object({
  id: z.string(),
  designation: z.string().nonempty({ message: "La désignation est requise" }),
  quantite: z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : validateInt(value),
    z
      .number()
      .int({ message: "La quantité doit être un entier" })
      .min(1, { message: "La quantité doit être au moins 1" })
  ),
  prixUnite: z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : validateFloat(value),
    z
      .number({ invalid_type_error: "Le prix d'unite doit être un nombre" })
      .min(1, { message: "Le prix d'nite doit être au moins 1" })
  ),
  stock: z.number().nullable(),
});
const updateCommandeSchema = z.object({
  id: z.string().nullable(),
  clientId: z.string({ required_error: "Champ obligatoir" }).uuid(),
  numero: z.string(),
  statut: z.string().default("En cours"),
  fraisLivraison: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateInt(value)),
    z.number().optional()
  ),
  reduction: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateInt(value)),
    z.number().optional()
  ),
  typeReduction: z.string().default("%"),
  avance: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateFloat(value)),
    z.number({ invalid_type_error: "L'avance' doit être un nombre" }).optional()
  ),
  note: z.string(),
  sousTotal: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateFloat(value)),
    z
      .number({ invalid_type_error: "Le sousTotal doit être un nombre" })
      .optional()
  ),
  total: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateFloat(value)),
    z.number({ invalid_type_error: "Le total doit être un nombre" }).optional()
  ),
  produits: z
    .array(productSchema)
    .min(1, { message: "La commande doit contenir au moins un produit" }),
  echeance: z.preprocess(
    (value) => (typeof value === "string" ? new Date(value) : value),
    z.date().nullable().default(null)
  ),
});

export default updateCommandeSchema;
