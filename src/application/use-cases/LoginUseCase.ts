import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/repositories/IPasswordHasher";
import { ITokenService } from "../../domain/repositories/IPasswordHasher";
import { InvalidCredentialsError, ValidationError } from "../../domain/errors/AppError";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    storeName: string;
    role: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    if (!input.email || !input.password) {
      throw new ValidationError("Correo y contraseña son obligatorios.");
    }

    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());

    // Importante: no revelar si el error es "usuario no existe" o "contraseña incorrecta".
    // Ambos casos devuelven el mismo error genérico por seguridad.
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const payload = { userId: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
      user: user.toPublicJSON(),
    };
  }
}
