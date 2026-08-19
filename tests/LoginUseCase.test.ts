import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { LoginUseCase } from "../src/application/use-cases/LoginUseCase";
import { InMemoryUserRepository } from "../src/infrastructure/services/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../src/infrastructure/services/BcryptPasswordHasher";
import { JwtTokenService } from "../src/infrastructure/services/JwtTokenService";
import { InvalidCredentialsError, ValidationError } from "../src/domain/errors/AppError";

describe("LoginUseCase", () => {
  let repository: InMemoryUserRepository;
  let hasher: BcryptPasswordHasher;
  let tokenService: JwtTokenService;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUseCase;

  const credentials = {
    email: "vendedor@tienda.com",
    password: "ContraseñaSegura123",
    storeName: "Mi Tienda",
  };

  beforeEach(async () => {
    repository = new InMemoryUserRepository();
    hasher = new BcryptPasswordHasher();
    tokenService = new JwtTokenService({
      accessSecret: "test-access-secret",
      refreshSecret: "test-refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });
    registerUseCase = new RegisterUserUseCase(repository, hasher);
    loginUseCase = new LoginUseCase(repository, hasher, tokenService);

    await registerUseCase.execute(credentials);
  });

  it("retorna accessToken y refreshToken válidos con credenciales correctas", async () => {
    const result = await loginUseCase.execute({
      email: credentials.email,
      password: credentials.password,
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe(credentials.email);

    // El token debe ser verificable y contener el payload correcto
    const payload = tokenService.verify(result.accessToken);
    expect(payload.email).toBe(credentials.email);
    expect(payload.role).toBe("VENDEDOR");
  });

  it("lanza InvalidCredentialsError si el correo no existe", async () => {
    await expect(
      loginUseCase.execute({ email: "noexiste@tienda.com", password: "cualquiera123" })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("lanza InvalidCredentialsError si la contraseña es incorrecta", async () => {
    await expect(
      loginUseCase.execute({ email: credentials.email, password: "ContraseñaIncorrecta" })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("lanza ValidationError si falta el email o la contraseña", async () => {
    await expect(loginUseCase.execute({ email: "", password: "" })).rejects.toThrow(
      ValidationError
    );
  });
});
