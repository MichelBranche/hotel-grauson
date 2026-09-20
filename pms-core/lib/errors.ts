export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "DOMAIN_ERROR", status = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Accesso non autorizzato.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Non hai i permessi per questa operazione.") {
    super(message, "FORBIDDEN", 403);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function errorMessage(error: unknown, fallback = "Operazione non riuscita.") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
