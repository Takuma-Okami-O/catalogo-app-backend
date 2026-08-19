import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { VerifyStoreUseCase } from "../src/application/use-cases/VerifyStoreUseCase";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { StoreNotFoundError } from "../src/domain/errors/AppError";

describe("VerifyStoreUseCase (RIF + verificación de super admin)", () => {
  let storeRepository: InMemoryStoreRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let verifyStoreUseCase: VerifyStoreUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    verifyStoreUseCase = new VerifyStoreUseCase(storeRepository);
  });

  it("una tienda nueva nace sin RIF y sin verificar", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    expect(store.rif).toBeNull();
    expect(store.isVerified).toBe(false);
  });

  it("el admin puede asignar un RIF y marcar la tienda como verificada", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    const updated = await verifyStoreUseCase.execute({
      storeId: store.id,
      rif: "J-12345678-9",
      isVerified: true,
    });

    expect(updated.rif).toBe("J-12345678-9");
    expect(updated.isVerified).toBe(true);
    expect(updated.toPublicJSON().rif).toBe("J-12345678-9");
    expect(updated.toPublicJSON().isVerified).toBe(true);
  });

  it("el admin puede quitar la verificación de una tienda", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });
    await verifyStoreUseCase.execute({ storeId: store.id, rif: "J-12345678-9", isVerified: true });

    const updated = await verifyStoreUseCase.execute({ storeId: store.id, rif: null, isVerified: false });

    expect(updated.rif).toBeNull();
    expect(updated.isVerified).toBe(false);
  });

  it("lanza StoreNotFoundError si la tienda no existe", async () => {
    await expect(
      verifyStoreUseCase.execute({ storeId: "no-existe", rif: "J-1", isVerified: true })
    ).rejects.toThrow(StoreNotFoundError);
  });
});
