import { JwtTokenService } from "../src/infrastructure/services/JwtTokenService";
import { InvalidTokenError } from "../src/domain/errors/AppError";

describe("JwtTokenService", () => {
  const payload = { userId: "abc-123", email: "vendedor@tienda.com", role: "VENDEDOR" };

  it("lanza un error explícito si falta algún secreto en la configuración", () => {
    expect(
      () =>
        new JwtTokenService({
          accessSecret: "",
          refreshSecret: "refresh-secret",
          accessExpiresIn: "15m",
          refreshExpiresIn: "7d",
        })
    ).toThrow(/accessSecret y refreshSecret son obligatorios/);
  });

  it("genera un accessToken verificable con el payload correcto", () => {
    const service = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });

    const token = service.generateAccessToken(payload);
    const decoded = service.verify(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("lanza InvalidTokenError si el token está manipulado", () => {
    const service = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });

    const token = service.generateAccessToken(payload);
    const tamperedToken = token.slice(0, -2) + "xx";

    expect(() => service.verify(tamperedToken)).toThrow(InvalidTokenError);
  });

  it("lanza InvalidTokenError si el token expiró", () => {
    const service = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "1ms",
      refreshExpiresIn: "7d",
    });

    const token = service.generateAccessToken(payload);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => service.verify(token)).toThrow(InvalidTokenError);
        resolve();
      }, 50);
    });
  });

  it("lanza InvalidTokenError si se verifica un token vacío o con formato inválido", () => {
    const service = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });

    expect(() => service.verify("token-invalido")).toThrow(InvalidTokenError);
  });
});
