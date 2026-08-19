import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { UpdateStoreWhatsAppMessageUseCase } from "../src/application/use-cases/UpdateStoreWhatsAppMessageUseCase";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../src/domain/errors/AppError";

describe("UpdateStoreWhatsAppMessageUseCase (personalización del admin, no del vendedor)", () => {
  let storeRepository: InMemoryStoreRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let updateMessageUseCase: UpdateStoreWhatsAppMessageUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    updateMessageUseCase = new UpdateStoreWhatsAppMessageUseCase(storeRepository);
  });

  it("el admin puede personalizar el mensaje de WhatsApp de una tienda", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    const updated = await updateMessageUseCase.execute({
      storeId: store.id,
      whatsappMessageTemplate: "¡Hola {storeName}! Pedido:\n{items}\nTotal: ${total}",
    });

    expect(updated.whatsappMessageTemplate).toBe("¡Hola {storeName}! Pedido:\n{items}\nTotal: ${total}");
  });

  it("rechaza un mensaje sin la variable {items}", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    await expect(
      updateMessageUseCase.execute({ storeId: store.id, whatsappMessageTemplate: "Hola, gracias por tu compra." })
    ).rejects.toThrow(ValidationError);
  });

  it("rechaza un mensaje vacío", async () => {
    const store = await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    await expect(
      updateMessageUseCase.execute({ storeId: store.id, whatsappMessageTemplate: "   " })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza StoreNotFoundError si la tienda no existe", async () => {
    await expect(
      updateMessageUseCase.execute({ storeId: "no-existe", whatsappMessageTemplate: "{items}" })
    ).rejects.toThrow(StoreNotFoundError);
  });
});
