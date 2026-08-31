import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../domain/repositories/IPasswordHasher";
import { ValidationError } from "../../domain/errors/AppError";
import { hashResetCode } from "./RequestPasswordResetUseCase";

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new ValidationError("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());

    // Mensaje genérico a propósito: no le decimos al que intenta si el
    // correo existe, si el código es incorrecto, o si ya venció — todo
    // se ve igual desde afuera, para no filtrar información útil a
    // alguien intentando adivinar códigos o correos válidos.
    const invalidMessage = "El código es inválido o ya venció. Solicita uno nuevo.";

    if (!user || !user.hasValidPendingResetCode()) {
      throw new ValidationError(invalidMessage);
    }

    const codeHash = hashResetCode(input.code.trim());
    if (codeHash !== user.passwordResetCodeHash) {
      throw new ValidationError(invalidMessage);
    }

    const newHash = await this.passwordHasher.hash(input.newPassword);
    user.updatePasswordHash(newHash);
    await this.userRepository.save(user);
  }
}
