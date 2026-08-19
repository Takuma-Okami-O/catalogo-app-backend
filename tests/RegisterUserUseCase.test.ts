import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { InMemoryUserRepository } from "../src/infrastructure/services/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../src/infrastructure/services/BcryptPasswordHasher";
import { UserAlreadyExistsError, ValidationError } from "../src/domain/errors/AppError";

describe("RegisterUserUseCase", () => {
  let repository: InMemoryUserRepository;
  let hasher: BcryptPasswordHasher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    hasher = new BcryptPasswordHasher();
    useCase = new RegisterUserUseCase(repository, hasher);
  });

  it("registra un usuario válido y guarda el hash, no la contraseña plana", async () => {
    const user = await useCase.execute({
      email: "vendedor@tienda.com",
      password: "SuperSegura123",
      storeName: "Tienda de Ana",
    });

    expect(user.email).toBe("vendedor@tienda.com");
    expect(user.passwordHash).not.toBe("SuperSegura123");
    expect(user.passwordHash.length).toBeGreaterThan(0);
  });

  it("lanza ValidationError si el email es inválido", async () => {
    await expect(
      useCase.execute({ email: "no-es-un-email", password: "SuperSegura123", storeName: "X" })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si la contraseña es muy corta", async () => {
    await expect(
      useCase.execute({ email: "a@a.com", password: "123", storeName: "X" })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si falta el nombre de la tienda", async () => {
    await expect(
      useCase.execute({ email: "a@a.com", password: "SuperSegura123", storeName: "   " })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza UserAlreadyExistsError si el correo ya está registrado", async () => {
    const input = {
      email: "duplicado@tienda.com",
      password: "SuperSegura123",
      storeName: "Tienda 1",
    };
    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toThrow(UserAlreadyExistsError);
  });
});
