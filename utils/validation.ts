import { ZodSchema } from "zod";
import createHttpError from "http-errors";

export const validate = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw createHttpError(400, result.error.flatten().fieldErrors);
  }
  return result.data;
};

