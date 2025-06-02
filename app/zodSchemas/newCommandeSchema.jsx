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
  designation: z.string().nonempty({ message: "La désignation est requise" }),
  quantite: z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : validateFloat(value),
    z
      .number({ invalid_type_error: "La quantité doit être un nombre" })
      .min(0.01, { message: "La quantité doit être au moins 0.01" })
  ),
  prixUnite: z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : validateFloat(value),
    z
      .number({ invalid_type_error: "Le prix d'unite doit être un nombre" })
      .min(1, { message: "Le prix d'nite doit être au moins 1" })
  ),
  stock: z.number(),
  id: z.string(),
  categorie: z.string().nullable(),
});
const newCommandeSchema = z
  .object({
    clientId: z.string({ required_error: "Champ obligatoir" }).uuid(),
    numero: z.string(),
    statut: z.string(),
    reduction: z.preprocess(
      (value) => (value === "" || value === undefined ? 0 : validateInt(value)),
      z.number().optional()
    ),
    typeReduction: z.string().default("%"),
    avance: z.preprocess(
      (value) =>
        value === "" || value === undefined ? 0 : validateFloat(value),
      z
        .number({ invalid_type_error: "L'avance' doit être un nombre" })
        .optional()
    ),
    compte: z.string().optional(),
    note: z.string(),
    sousTotal: z.preprocess(
      (value) =>
        value === "" || value === undefined ? 0 : validateFloat(value),
      z
        .number({ invalid_type_error: "Le sousTotal doit être un nombre" })
        .optional()
    ),
    total: z.preprocess(
      (value) =>
        value === "" || value === undefined ? 0 : validateFloat(value),
      z
        .number({ invalid_type_error: "Le total doit être un nombre" })
        .optional()
    ),
    totalDevi: z.preprocess(
      (value) =>
        value === "" || value === undefined ? 0 : validateFloat(value),
      z
        .number({ invalid_type_error: "Le total doit être un nombre" })
        .optional()
    ),
    produits: z
      .array(productSchema)
      .min(1, { message: "La commande doit contenir au moins un produit" }),
    echeance: z.date().nullable().default(null),
  })
  .refine(
    (data) => data.avance === 0 || data.compte, // If `avance` > 0, `compte` must be provided
    {
      message: "Le compte est requis lorsque l'avance est spécifiée",
      path: ["compte"], // Attach error message to `compte`
    }
  );

export default newCommandeSchema;
