import z, { Schema } from 'zod'
import { BadRequestError } from './errors.js'

export const stringBooleanSchema = z
  .enum(["true", "false"])
  .default('false')
  .transform((v) => v === "true") as unknown as z.ZodDefault<z.ZodBoolean>

export const validate = <T>(schema: Schema<T>, input: unknown): T => {
  const { error, data } = schema.safeParse(input)
  if (error) {
    throw new BadRequestError(JSON.stringify(error.issues))
  }
  return data
}
