import { createHash, randomInt } from "node:crypto";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IEmailSender } from "../../domain/repositories/IEmailSender";

const CODE_EXPIRATION_MINUTES = 15;

export function hashResetCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Genera un código de 6 dígitos, lo guarda hasheado (nunca en texto plano)
 * y lo envía por correo. SIEMPRE responde "éxito" al llamador, exista o no
 * ese correo en la base de datos — así nadie puede usar este endpoint para
 * averiguar qué correos están registrados en la plataforma.
 */
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailSender: IEmailSender
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return; // no revelamos si el correo existe o no
    }

    const code = randomInt(100000, 999999).toString();
    const codeHash = hashResetCode(code);
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    user.setPasswordResetCode(codeHash, expiresAt);
    await this.userRepository.save(user);

    await this.emailSender.sendPasswordResetEmail({
      to: user.email,
      storeName: user.storeName,
      code,
    });
  }
}
