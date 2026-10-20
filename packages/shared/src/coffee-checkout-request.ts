import { z } from "zod";
import { isValidCpf } from "./cpf";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const phone = z
  .string()
  .trim()
  .transform((value) => {
    const digits = onlyDigits(value);
    return value.startsWith("+") || digits.length > 11 ? digits : `55${digits}`;
  })
  .pipe(z.string().regex(/^\d{10,15}$/));

const cpf = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCpf)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const coffeePayerSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.email().max(254),
  phone,
  cpf,
});

const fingerprint = z.string().trim().min(8).max(128);
const idempotencyKey = z.uuid();

export const pixCoffeeRequestSchema = z.object({
  payer: coffeePayerSchema,
  fingerprint,
  idempotencyKey,
});

export const cardCoffeeRequestSchema = z.object({
  payer: coffeePayerSchema,
  fingerprint,
  idempotencyKey,
  cardToken: z.string().min(1).max(512),
  antifraudReference: z.string().min(1).max(512),
  threeDSecure: z.object({
    cavv: z.string().max(256).optional(),
    eci: z.string().max(8).optional(),
    xid: z.string().max(256).optional(),
    referenceId: z.string().max(256).optional(),
    version: z.string().max(16).optional(),
  }),
});

export type CoffeePayer = z.infer<typeof coffeePayerSchema>;
export type PixCoffeeRequest = z.infer<typeof pixCoffeeRequestSchema>;
export type CardCoffeeRequest = z.infer<typeof cardCoffeeRequestSchema>;
