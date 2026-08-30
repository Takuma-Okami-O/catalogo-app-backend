import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { LoginUseCase } from "../src/application/use-cases/LoginUseCase";
import { RefreshTokenUseCase } from "../src/application/use-cases/RefreshTokenUseCase";
import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { StartFreeTrialUseCase } from "../src/application/use-cases/StartFreeTrialUseCase";
import { InMemoryUserRepository } from "../src/infrastructure/services/InMemoryUserRepository";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { BcryptPasswordHasher } from "../src/infrastructure/services/BcryptPasswordHasher";
import { JwtTokenService } from "../src/infrastructure/services/JwtTokenService";
import { InvalidTokenError, ValidationError } from "../src/domain/errors/AppError";

describe("RefreshTokenUseCase", () => {
  it("emite un nuevo accessToken válido a partir de un refreshToken válido", async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new BcryptPasswordHasher();
    const tokenService = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });
    const registerUseCase = new RegisterUserUseCase(userRepository, hasher);
    const loginUseCase = new LoginUseCase(userRepository, hasher, tokenService);
    const refreshUseCase = new RefreshTokenUseCase(tokenService, userRepository);

    await registerUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaSegura123",
      storeName: "Mi Tienda",
    });
    const loginResult = await loginUseCase.execute({
      email: "vendedor@tienda.com",
      password: "ContraseñaSegura123",
    });

    const refreshed = await refreshUseCase.execute(loginResult.refreshToken);

    expect(refreshed.accessToken).toBeDefined();
    const payload = tokenService.verify(refreshed.accessToken);
    expect(payload.email).toBe("vendedor@tienda.com");
  });

  it("lanza InvalidTokenError si el refreshToken es inválido", async () => {
    const userRepository = new InMemoryUserRepository();
    const tokenService = new JwtTokenService({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    });
    const refreshUseCase = new RefreshTokenUseCase(tokenService, userRepository);

    await expect(refreshUseCase.execute("token-basura")).rejects.toThrow(InvalidTokenError);
  });
});

describe("StartFreeTrialUseCase", () => {
  it("activa Premium por 7 días la primera vez", async () => {
    const storeRepository = new InMemoryStoreRepository();
    const createStoreUseCase = new CreateStoreUseCase(storeRepository);
    const startTrialUseCase = new StartFreeTrialUseCase(storeRepository);

    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda de Prueba",
      whatsappPhone: "584120000000",
    });
    expect(store.plan).toBe("FREE");

    const upgraded = await startTrialUseCase.execute("vendedor-1");

    expect(upgraded.plan).toBe("PREMIUM");
    expect(upgraded.productLimit).toBe(500);
    expect(upgraded.hasUsedTrial).toBe(true);
  });

  it("rechaza activarla dos veces en la misma tienda", async () => {
    const storeRepository = new InMemoryStoreRepository();
    const createStoreUseCase = new CreateStoreUseCase(storeRepository);
    const startTrialUseCase = new StartFreeTrialUseCase(storeRepository);

    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda de Prueba",
      whatsappPhone: "584120000000",
    });

    await startTrialUseCase.execute("vendedor-1");

    await expect(startTrialUseCase.execute("vendedor-1")).rejects.toThrow(ValidationError);
  });
});
