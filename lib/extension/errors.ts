export abstract class HttpError extends Error {
  public readonly status: number

  constructor(message: string, status: number){
    super(message)
    this.status = status
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string){
    super(message, 400)
  }
}
