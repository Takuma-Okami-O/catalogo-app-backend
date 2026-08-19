import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { UpdateStoreSettingsUseCase } from "../src/application/use-cases/UpdateStoreSettingsUseCase";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../src/domain/errors/AppError";

describe("UpdateStoreSettingsUseCase", () => {
  let storeRepository: InMemoryStoreRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let updateStoreSettingsUseCase: UpdateStoreSettingsUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    updateStoreSettingsUseCase = new UpdateStoreSettingsUseCase(storeRepository);
  });

  it("actualiza logo, nombre y redes sociales de la tienda del dueño", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Original",
      whatsappPhone: "584120000000",
    });

    const updated = await updateStoreSettingsUseCase.execute({
      ownerId: "vendedor-1",
      name: "Boutique Gaby",
      logoUrl: "https://cloudinary.com/logo.png",
      instagramUrl: "https://instagram.com/boutiquegaby",
      tiktokUrl: "https://tiktok.com/@boutiquegaby",
    });

    expect(updated.name).toBe("Boutique Gaby");
    expect(updated.logoUrl).toBe("https://cloudinary.com/logo.png");
    expect(updated.instagramUrl).toBe("https://instagram.com/boutiquegaby");
    expect(updated.tiktokUrl).toBe("https://tiktok.com/@boutiquegaby");
  });

  it("lanza StoreNotFoundError si el vendedor no tiene tienda", async () => {
    await expect(
      updateStoreSettingsUseCase.execute({ ownerId: "vendedor-sin-tienda", name: "X" })
    ).rejects.toThrow(StoreNotFoundError);
  });

  it("rechaza un número de WhatsApp inválido", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda",
      whatsappPhone: "584120000000",
    });

    await expect(
      updateStoreSettingsUseCase.execute({ ownerId: "vendedor-1", whatsappPhone: "123" })
    ).rejects.toThrow(ValidationError);
  });
});
