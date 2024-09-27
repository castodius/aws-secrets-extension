import z, { Schema, ZodSchema } from 'zod'
import { BadRequestError } from './errors.js'

export const stringBooleanSchema = z
  .enum(["true", "false"])
  .default('false')
  .transform((v) => v === "true") as unknown as z.ZodDefault<z.ZodBoolean>

export const validate = <T extends ZodSchema>(schema: T, input: unknown): z.output<T> => {
  const { error, data } = schema.safeParse(input)
  if (error) {
    throw new BadRequestError(JSON.stringify(error.issues))
  }
  return data
}
