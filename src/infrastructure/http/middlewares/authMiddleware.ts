import { Request, Response, NextFunction } from "express";
import { ITokenService } from "../../../domain/repositories/IPasswordHasher";
import { MissingTokenError } from "../../../domain/errors/AppError";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware factory: recibe el servicio de tokens por inyección de dependencias
 * en lugar de instanciarlo internamente (facilita testear con mocks).
 */
export function createAuthMiddleware(tokenService: ITokenService) {
  return function authMiddleware(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void {
    // Nota: en Express 4, los errores síncronos dentro de un middleware NO se
    // propagan automáticamente al errorHandler global; hay que capturarlos
    // y pasarlos explícitamente con next(error). (Express 5 sí lo haría solo).
    try {
      const header = req.headers.authorization;

      if (!header || !header.startsWith("Bearer ")) {
        throw new MissingTokenError();
      }

      const token = header.split(" ")[1];
      if (!token) {
        throw new MissingTokenError();
      }

      const payload = tokenService.verify(token);

      req.auth = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
