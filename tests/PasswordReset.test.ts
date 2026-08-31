import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { RequestPasswordResetUseCase } from "../src/application/use-cases/RequestPasswordResetUseCase";
import { ResetPasswordUseCase } from "../src/application/use-cases/ResetPasswordUseCase";
import { LoginUseCase } from "../src/application/use-cases/LoginUseCase";
import { InMemoryUserRepository } from "../src/infrastructure/services/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../src/infrastructure/services/BcryptPasswordHasher";
import { JwtTokenService } from "../src/infrastructure/services/JwtTokenService";
import { IEmailSender } from "../src/domain/repositories/IEmailSender";
import { ValidationError } from "../src/domain/errors/AppError";

/** Correo falso para pruebas: solo guarda el último código enviado, no manda nada de verdad. */
class FakeEmailSender implements IEmailSender {
  public lastCodeSent: string | null = null;
  public lastEmailSentTo: string | null = null;

  async sendPasswordResetEmail(input: { to: string; storeName: string; code: string }): Promise<void> {
    this.lastCodeSent = input.code;
    this.lastEmailSentTo = input.to;
  }
}

describe("Recuperación de contraseña", () => {
  let repository: InMemoryUserRepository;
  let hasher: BcryptPasswordHasher;
  let emailSender: FakeEmailSender;
  let registerUseCase: RegisterUserUseCase;
  let requestResetUseCase: RequestPasswordResetUseCase;
  let resetPasswordUseCase: ResetPasswordUseCase;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    hasher = new BcryptPasswordHasher();
    emailSender = new FakeEmailSender();
    registerUseCase = new RegisterUserUseCase(repository, hasher);
    requestResetUseCase = new RequestPasswordResetUseCase(repository, emailSender);
    resetPasswordUseCase = new ResetPasswordUseCase(repository, hasher);
    loginUseCase = new LoginUseCase(
      repository,
      hasher,
      new JwtTokenService({ accessSecret: "test", refreshSecret: "test", accessExpiresIn: "15m", refreshExpiresIn: "7d" })
    );
  });

  it("envía un código de 6 dígitos cuando el correo existe", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });

    await requestResetUseCase.execute("vendedor@tienda.com");

    expect(emailSender.lastEmailSentTo).toBe("vendedor@tienda.com");
    expect(emailSender.lastCodeSent).toMatch(/^\d{6}$/);
  });

  it("no envía nada ni lanza error si el correo no existe (evita revelar cuentas)", async () => {
    await expect(requestResetUseCase.execute("noexiste@nada.com")).resolves.not.toThrow();
    expect(emailSender.lastEmailSentTo).toBeNull();
  });

  it("permite cambiar la contraseña con el código correcto, y ya se puede iniciar sesión con la nueva", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });
    await requestResetUseCase.execute("vendedor@tienda.com");
    const code = emailSender.lastCodeSent!;

    await resetPasswordUseCase.execute({
      email: "vendedor@tienda.com",
      code,
      newPassword: "ContraseñaNueva456",
    });

    const result = await loginUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaNueva456",
    });
    expect(result.user.email).toBe("vendedor@tienda.com");
  });

  it("rechaza un código incorrecto", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });
    await requestResetUseCase.execute("vendedor@tienda.com");

    await expect(
      resetPasswordUseCase.execute({
        email: "vendedor@tienda.com",
        code: "000000",
        newPassword: "ContraseñaNueva456",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("rechaza un código si nunca se solicitó uno", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });

    await expect(
      resetPasswordUseCase.execute({
        email: "vendedor@tienda.com",
        code: "123456",
        newPassword: "ContraseñaNueva456",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("rechaza una contraseña nueva demasiado corta", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });
    await requestResetUseCase.execute("vendedor@tienda.com");
    const code = emailSender.lastCodeSent!;

    await expect(
      resetPasswordUseCase.execute({ email: "vendedor@tienda.com", code, newPassword: "123" })
    ).rejects.toThrow(ValidationError);
  });

  it("rechaza un código ya vencido", async () => {
    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaVieja123",
      storeName: "Tienda de Ana",
    });
    await requestResetUseCase.execute("vendedor@tienda.com");
    const code = emailSender.lastCodeSent!;

    // Forzamos que el código ya haya vencido, simulando que pasaron los 15 minutos.
    const user = await repository.findByEmail("vendedor@tienda.com");
    user!.setPasswordResetCode(user!.passwordResetCodeHash!, new Date(Date.now() - 1000));
    await repository.save(user!);

    await expect(
      resetPasswordUseCase.execute({ email: "vendedor@tienda.com", code, newPassword: "ContraseñaNueva456" })
    ).rejects.toThrow(ValidationError);
  });
});
