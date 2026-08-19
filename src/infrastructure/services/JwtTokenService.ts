import jwt from "jsonwebtoken";
import { ITokenService, TokenPayload } from "../../domain/repositories/IPasswordHasher";
import { InvalidTokenError } from "../../domain/errors/AppError";

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string; // ej: "15m"
  refreshExpiresIn: string; // ej: "7d"
}

export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {
    if (!config.accessSecret || !config.refreshSecret) {
      throw new Error(
        "JwtTokenService: accessSecret y refreshSecret son obligatorios. " +
          "No se permite arrancar el servicio sin secretos configurados."
      );
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: this.config.accessExpiresIn as jwt.SignOptions["expiresIn"],
      subject: payload.userId,
    };
    return jwt.sign(payload, this.config.accessSecret, options);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: this.config.refreshExpiresIn as jwt.SignOptions["expiresIn"],
      subject: payload.userId,
    };
    return jwt.sign(payload, this.config.refreshSecret, options);
  }

  verify(token: string): TokenPayload {
    return this.verifyWithSecret(token, this.config.accessSecret);
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.verifyWithSecret(token, this.config.refreshSecret);
  }

  private verifyWithSecret(token: string, secret: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, secret);
      return decoded as unknown as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new InvalidTokenError("El token ha expirado.");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError("El token es inválido o fue manipulado.");
      }
      throw new InvalidTokenError("No se pudo verificar el token.");
    }
  }
}
