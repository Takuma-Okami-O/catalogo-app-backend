import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { GenerateActivationCodeUseCase } from "../src/application/use-cases/GenerateActivationCodeUseCase";
import { RedeemActivationCodeUseCase } from "../src/application/use-cases/RedeemActivationCodeUseCase";
import {
  InMemoryStoreRepository,
  InMemoryPremiumCodeRepository,
} from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ValidationError } from "../src/domain/errors/AppError";

describe("Códigos de activación Premium", () => {
  let storeRepository: InMemoryStoreRepository;
  let codeRepository: InMemoryPremiumCodeRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let generateCodeUseCase: GenerateActivationCodeUseCase;
  let redeemCodeUseCase: RedeemActivationCodeUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    codeRepository = new InMemoryPremiumCodeRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    generateCodeUseCase = new GenerateActivationCodeUseCase(codeRepository);
    redeemCodeUseCase = new RedeemActivationCodeUseCase(storeRepository, codeRepository);
  });

  it("genera un código único de formato XXXX-XXXX", async () => {
    const result = await generateCodeUseCase.execute(30);
    expect(result.code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(result.durationDays).toBe(30);
  });

  it("activa Premium al canjear un código válido", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });
    const { code } = await generateCodeUseCase.execute(30);

    const upgraded = await redeemCodeUseCase.execute("vendedor-1", code);

    expect(upgraded.plan).toBe("PREMIUM");
    expect(upgraded.productLimit).toBe(500);
  });

  it("rechaza un código inexistente", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    await expect(redeemCodeUseCase.execute("vendedor-1", "AAAA-BBBB")).rejects.toThrow(ValidationError);
  });

  it("rechaza un código ya usado", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Uno",
      whatsappPhone: "584120000000",
    });
    await createStoreUseCase.execute({
      ownerId: "vendedor-2",
      name: "Tienda Dos",
      whatsappPhone: "584140000000",
    });
    const { code } = await generateCodeUseCase.execute(30);

    await redeemCodeUseCase.execute("vendedor-1", code);

    await expect(redeemCodeUseCase.execute("vendedor-2", code)).rejects.toThrow(ValidationError);
  });

  it("acepta el código sin importar mayúsculas/minúsculas o espacios extra", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });
    const { code } = await generateCodeUseCase.execute(30);

    const upgraded = await redeemCodeUseCase.execute("vendedor-1", `  ${code.toLowerCase()}  `);

    expect(upgraded.plan).toBe("PREMIUM");
  });
});
