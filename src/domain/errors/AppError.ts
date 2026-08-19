/**
 * Clase base para todos los errores controlados de la aplicación.
 * Cada error conoce su propio código HTTP y un código interno
 * identificable para logs/monitoreo.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidCredentialsError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "AUTH_INVALID_CREDENTIALS";

  constructor() {
    super("Correo o contraseña incorrectos.");
  }
}

export class UserAlreadyExistsError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "AUTH_USER_EXISTS";

  constructor(email: string) {
    super(`Ya existe un usuario registrado con el correo: ${email}`);
  }
}

export class InvalidTokenError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "AUTH_INVALID_TOKEN";

  constructor(reason: string = "Token inválido o expirado.") {
    super(reason);
  }
}

export class MissingTokenError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "AUTH_MISSING_TOKEN";

  constructor() {
    super("No se proporcionó un token de autenticación.");
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class UserNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = "USER_NOT_FOUND";

  constructor() {
    super("El usuario no existe.");
  }
}

export class StoreNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = "STORE_NOT_FOUND";

  constructor() {
    super("La tienda no existe o el link no es válido.");
  }
}

export class SlugAlreadyExistsError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "SLUG_ALREADY_EXISTS";

  constructor(slug: string) {
    super(`El identificador de link "${slug}" ya está en uso.`);
  }
}

export class ProductNotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = "PRODUCT_NOT_FOUND";

  constructor() {
    super("El producto no existe o no pertenece a esta tienda.");
  }
}

export class ProductLimitExceededError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = "PRODUCT_LIMIT_EXCEEDED";

  constructor(limit: number, plan: string) {
    super(
      `Alcanzaste el límite de ${limit} productos de tu plan ${plan}. Actualiza a Premium para agregar más.`
    );
  }
}

export class CategoryInUseError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "CATEGORY_IN_USE";

  constructor(name: string) {
    super(`No puedes eliminar la categoría "${name}" porque tiene productos asociados.`);
  }
}

export class EmptyOrderError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "EMPTY_ORDER";

  constructor() {
    super("El pedido debe contener al menos un producto.");
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = "FORBIDDEN";

  constructor(message: string = "No tienes permisos para realizar esta acción.") {
    super(message);
  }
}
