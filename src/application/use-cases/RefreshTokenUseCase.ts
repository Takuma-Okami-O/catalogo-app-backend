import { ITokenService } from "../../domain/repositories/IPasswordHasher";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { InvalidTokenError, UserNotFoundError } from "../../domain/errors/AppError";

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Permite que la app renueve la sesión sin pedirle al vendedor que
 * vuelva a escribir su correo/contraseña, siempre que su refresh token
 * (de vida más larga) siga siendo válido.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenOutput> {
    if (!refreshToken) {
      throw new InvalidTokenError("No se proporcionó un refresh token.");
    }

    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    // Confirma que el usuario siga existiendo (pudo haber sido eliminado).
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.tokenService.generateAccessToken(newPayload),
      refreshToken: this.tokenService.generateRefreshToken(newPayload),
    };
  }
}
