export class ApiError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }

  static badRequest(message: string) {
    return new ApiError(message, 400)
  }

  static unauthorized(message: string = 'Não autenticado') {
    return new ApiError(message, 401)
  }

  static forbidden(message: string = 'Sem permissão para esta ação') {
    return new ApiError(message, 403)
  }

  static notFound(message: string = 'Recurso não encontrado') {
    return new ApiError(message, 404)
  }

  static conflict(message: string) {
    return new ApiError(message, 409)
  }

  static internal(message: string = 'Erro interno do servidor') {
    return new ApiError(message, 500)
  }
}
