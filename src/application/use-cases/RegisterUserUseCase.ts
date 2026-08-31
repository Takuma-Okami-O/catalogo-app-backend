import { randomUUID } from "node:crypto";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/repositories/IPasswordHasher";
import { UserAlreadyExistsError, ValidationError } from "../../domain/errors/AppError";

export interface RegisterUserInput {
  email: string;
  password: string;
  storeName: string;
}

const MIN_PASSWORD_LENGTH = 8;

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    this.validate(input);

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new UserAlreadyExistsError(input.email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: randomUUID(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      storeName: input.storeName.trim(),
      role: "VENDEDOR",
      createdAt: new Date(),
      passwordResetCodeHash: null,
      passwordResetExpiresAt: null,
    });

    await this.userRepository.save(user);
    return user;
  }

  private validate(input: RegisterUserInput): void {
    if (!input.email || !input.email.includes("@")) {
      throw new ValidationError("El correo electrónico no tiene un formato válido.");
    }
    if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      );
    }
    if (!input.storeName || input.storeName.trim().length === 0) {
      throw new ValidationError("El nombre del emprendimiento es obligatorio.");
    }
  }
}
