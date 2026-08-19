import { Request, Response } from "express";
import {
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
} from "../src/infrastructure/http/middlewares/globalErrorHandler";
import { InvalidCredentialsError } from "../src/domain/errors/AppError";

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("globalErrorHandler", () => {
  it("responde con el statusCode y errorCode correctos para un AppError conocido", () => {
    const req = { path: "/api/auth/login", method: "POST" } as Request;
    const res = mockResponse();
    const next = jest.fn();

    globalErrorHandler(new InvalidCredentialsError(), req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: "AUTH_INVALID_CREDENTIALS",
      })
    );
  });

  it("responde con 500 genérico y oculta detalles para un error NO controlado", () => {
    const req = { path: "/api/auth/login", method: "POST" } as Request;
    const res = mockResponse();
    const next = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    globalErrorHandler(new Error("fallo interno de base de datos"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: "INTERNAL_SERVER_ERROR",
      })
    );
    // El error nunca se descarta en silencio: siempre se registra.
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("notFoundHandler responde 404 con información de la ruta solicitada", () => {
    const req = { path: "/ruta-inexistente", method: "GET" } as Request;
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "ROUTE_NOT_FOUND" })
    );
  });

  it("asyncHandler captura el rechazo de una promesa y lo pasa a next()", async () => {
    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn();
    const error = new InvalidCredentialsError();

    const failingController = async () => {
      throw error;
    };

    await asyncHandler(failingController)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
