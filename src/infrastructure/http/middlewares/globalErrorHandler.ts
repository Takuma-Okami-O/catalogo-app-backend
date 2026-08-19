import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../domain/errors/AppError";

interface ErrorResponseBody {
  success: false;
  errorCode: string;
  message: string;
  stack?: string;
}

/**
 * Manejador global de errores. Debe registrarse SIEMPRE como el último
 * middleware, después de todas las rutas: app.use(globalErrorHandler)
 *
 * Estrategia:
 *  - Errores conocidos (AppError): se exponen con su statusCode y mensaje real.
 *  - Errores desconocidos: se ocultan al cliente (500 genérico) pero se
 *    loguean completos en el servidor, nunca se "tragan" en silencio.
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (err instanceof AppError) {
    const body: ErrorResponseBody = {
      success: false,
      errorCode: err.errorCode,
      message: err.message,
    };
    if (isDev) body.stack = err.stack;

    res.status(err.statusCode).json(body);
    return;
  }

  // Error NO controlado: se registra explícitamente (nunca se descarta)
  // y se responde de forma genérica para no filtrar detalles internos.
  // eslint-disable-next-line no-console
  console.error("[UNHANDLED_ERROR]", {
    path: req.path,
    method: req.method,
    error: err,
  });

  const body: ErrorResponseBody = {
    success: false,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Ocurrió un error inesperado en el servidor.",
  };
  if (isDev && err instanceof Error) body.stack = err.stack;

  res.status(500).json(body);
}

/**
 * Wrapper para controladores async: evita tener que escribir try/catch
 * en cada controlador. Cualquier rechazo de promesa se envía a next(),
 * que lo entrega al globalErrorHandler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Middleware para capturar rutas no encontradas (404).
 * Debe ir justo antes del globalErrorHandler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    errorCode: "ROUTE_NOT_FOUND",
    message: `La ruta ${req.method} ${req.path} no existe.`,
  });
}
