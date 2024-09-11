import { variables } from "./env.js"

export type LogFormat = 'json' | 'text'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type Message = string | object

export class Logger {
  #format: LogFormat
  #level: number
  #levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
  #writerFunction: (message: string) => void

  constructor(format: LogFormat, level: LogLevel, writerFunction = console.log) {
    this.#format = format
    this.#level = this.#levels.indexOf(level)
    this.#writerFunction = writerFunction

    this.debug(`Logger instantiated with format ${format} and log level ${level}`)
  }

  private format(message: Message, level: LogLevel): string {
    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message)
    const objectMessage = typeof message === 'string' ? { message } : message
    return this.#format === 'json'
      ? JSON.stringify({
        ...objectMessage,
        level
      })
      : `[${level.toUpperCase()}]: ${stringMessage}`
  }

  private log(message: Message, level: LogLevel) {
    if (this.#levels.indexOf(level) < this.#level) {
      return
    }

    this.#writerFunction(this.format(message, level))
  }

  public debug(message: Message) {
    this.log(message, 'debug')
  }

  public info(message: Message) {
    this.log(message, 'info')
  }

  public warn(message: Message) {
    this.log(message, 'warn')
  }

  public error(message: Message) {
    this.log(message, 'error')
  }
}

export const logger = new Logger(variables.LOG_FORMAT, variables.LOG_LEVEL)
