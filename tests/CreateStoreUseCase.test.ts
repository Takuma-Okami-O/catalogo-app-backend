import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ValidationError } from "../src/domain/errors/AppError";

describe("CreateStoreUseCase", () => {
  let repository: InMemoryStoreRepository;
  let useCase: CreateStoreUseCase;

  beforeEach(() => {
    repository = new InMemoryStoreRepository();
    useCase = new CreateStoreUseCase(repository);
  });

  it("genera un slug limpio a partir del nombre de la tienda", async () => {
    const store = await useCase.execute({
      ownerId: "user-1",
      name: "Gaby Encantos",
      whatsappPhone: "584120000000",
    });

    expect(store.slug).toBe("gaby-encantos");
    expect(store.plan).toBe("FREE");
    expect(store.productLimit).toBe(500);
  });

  it("evita colisiones de slug agregando un sufijo numérico", async () => {
    await useCase.execute({ ownerId: "user-1", name: "Boutique Stylo", whatsappPhone: "584140000000" });
    const second = await useCase.execute({
      ownerId: "user-2",
      name: "Boutique Stylo",
      whatsappPhone: "584140000001",
    });

    expect(second.slug).toBe("boutique-stylo-2");
  });

  it("normaliza acentos y caracteres especiales en el slug", async () => {
    const store = await useCase.execute({
      ownerId: "user-3",
      name: "Artesanías del Pueblo!!",
      whatsappPhone: "584160000000",
    });

    expect(store.slug).toBe("artesanias-del-pueblo");
  });

  it("lanza ValidationError si falta el teléfono de WhatsApp", async () => {
    await expect(
      useCase.execute({ ownerId: "user-4", name: "Mi Tienda", whatsappPhone: "" })
    ).rejects.toThrow(ValidationError);
  });
});
