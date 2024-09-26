export abstract class HttpError extends Error {
  public readonly status: number

  constructor(message: string, status: number){
    super(message)
    this.status = status
  }
}

export class BadRequest extends HttpError {
  constructor(message: string){
    super(message, 400)
  }
}
