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

const articlSchema = z.object({
  key: z.string(),
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
      .min(1, { message: "Le prix d'unite doit être au moins 1" })
  ),
  length: z.preprocess(
    (value) =>
      value === "" || value === undefined ? undefined : validateFloat(value),
    z
      .number({ invalid_type_error: "Le prix d'unite doit être un nombre" })
      .min(1, { message: "ce champ doit contenire un nombre" })
  ),
  width: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;
    return parseFloat(value);
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre" }).optional()),
  id: z.string(),
  unite: z.string().optional(),
});
const updateDeviSchema = z.object({
  id: z.string(),
  clientId: z.string({ required_error: "Champ obligatoir" }),
  numero: z.string(),
  statut: z.string(),
  fraisLivraison: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateInt(value)),
    z.number().optional()
  ),
  reduction: z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : validateInt(value)),
    z.number().optional()
  ),
  typeReduction: z.string().default("%"),
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
  articls: z
    .array(articlSchema)
    .min(1, { message: "La commande doit contenir au moins un articl" }),
});

export default updateDeviSchema;
