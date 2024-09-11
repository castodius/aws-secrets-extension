export const getVariable = (suffix: string) => {
  const prefix = process.env.AWS_SECRETS_EXTENSION_PREFIX ?? 'AWS_SECRETS_EXTENSION'
  return process.env[`${prefix}_${suffix}`]
}

export const getVariableInt = (suffix: string, defaultValue: number): number => {
  const variable = getVariable(suffix)
  if (!variable) {
    return defaultValue
  }

  const parsed = parseInt(variable)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

export const getVariableBoolean = (suffix: string, defaultValue: boolean): boolean => {
  const variable = getVariable(suffix)
  if (!variable) {
    return defaultValue
  }

  if (!['true', 'false'].includes(variable)) {
    return defaultValue
  }

  return variable === 'true'
}

export const getVariableEnum = (suffix: string, allowedValues: string[], defaultValue: string): string => {
  const variable = getVariable(suffix)
  if (!variable) {
    return defaultValue
  }

  if(!allowedValues.includes(variable)){
    return defaultValue
  }

  return variable
}

