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
  designation: z.string().nonempty({ message: "La désignation est requise" }),
  key: z.string(),
  quantite: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
  prixUnite: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
  length: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
  width: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
  height: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
  id: z.string(),
  unite: z.string().optional(),
});
const newDeviSchema = z.object({
  clientId: z.string({ required_error: "Champ obligatoir" }),
  numero: z.string(),
  statut: z.string(),
  tva: z.preprocess(
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
  // avance: z.preprocess(
  //   (value) =>
  //     value === "" || value === undefined ? 0 : validateFloat(value),
  //   z
  //     .number({ invalid_type_error: "L'avance' doit être un nombre" })
  //     .optional()
  // ),
  // compte: z.string().optional(),
  echeance: z.date().nullable().default(null),
  articls: z
    .array(articlSchema)
    .min(1, { message: "Le devis doit contenir au moins un articl" })
    .refine(
      (articles) =>
        articles.every((article) => articlSchema.safeParse(article).success),
      {
        message: "Un ou plusieurs articles sont invalides",
      }
    ),
});

export default newDeviSchema;
