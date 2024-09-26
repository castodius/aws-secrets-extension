export const getVariable = (suffix: string) => {
  const prefix = process.env.AWS_SECRETS_EXTENSION_PREFIX ?? 'AWS_SECRETS_EXTENSION'
  return process.env[`${prefix}_${suffix}`]
}

export const getVariableString = (suffix: string, defaultValue: string): string => {
  return getVariable(suffix) ?? defaultValue
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

export const getVariableEnum = <T extends string>(suffix: string, allowedValues: T[], defaultValue: T): T => {
  const variable = getVariable(suffix) as T | undefined
  if (!variable) {
    return defaultValue
  }

  if(!allowedValues.includes(variable)){
    return defaultValue
  }

  return variable
}

export const variables = {
  LOG_FORMAT: getVariableEnum('LOG_FORMAT', ['json', 'text'], 'json'),
  LOG_LEVEL: getVariableEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info'),
  HTTP_PORT: getVariableInt('HTTP_PORT', 2773),
  CACHE_SIZE: getVariableInt('CACHE_SIZE', 1000),
  PREFETCH_SSM_GET_PARAMETER: getVariableString('PREFETCH_SSM_GET_PARAMETER', '').split(',').filter(Boolean),
  PREFETCH_SSM_GET_PARAMETERS: getVariableString('PREFETCH_SSM_GET_PARAMETERS', '').split(',').filter(Boolean),
  PREFETCH_SM_GET_SECRET_VALUE: getVariableString('PREFETCH_SM_GET_SECRET_VALUE', '').split(',').filter(Boolean),
  SSM_TIMEOUT: getVariableInt('SSM_TIMEOUT', 0),
  SM_TIMEOUT: getVariableInt('SSM_TIMEOUT', 0),
  MAX_CONNECTIONS: getVariableInt('MAX_CONNECTIONS', 10)
}
