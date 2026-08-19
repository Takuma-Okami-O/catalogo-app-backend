import { CreateStoreUseCase } from "../src/application/use-cases/CreateStoreUseCase";
import { AddTestimonialUseCase, RemoveTestimonialUseCase } from "../src/application/use-cases/TestimonialUseCases";
import { InMemoryStoreRepository } from "../src/infrastructure/services/InMemoryCatalogRepositories";
import { ValidationError } from "../src/domain/errors/AppError";

describe("Testimonios (capturas de compradores)", () => {
  let storeRepository: InMemoryStoreRepository;
  let createStoreUseCase: CreateStoreUseCase;
  let addTestimonialUseCase: AddTestimonialUseCase;
  let removeTestimonialUseCase: RemoveTestimonialUseCase;

  beforeEach(() => {
    storeRepository = new InMemoryStoreRepository();
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    addTestimonialUseCase = new AddTestimonialUseCase(storeRepository);
    removeTestimonialUseCase = new RemoveTestimonialUseCase(storeRepository);
  });

  it("agrega una captura de comprador a la tienda", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    const updated = await addTestimonialUseCase.execute("vendedor-1", "https://cloudinary.com/captura1.jpg");

    expect(updated.testimonialUrls).toContain("https://cloudinary.com/captura1.jpg");
  });

  it("elimina una captura existente", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });
    await addTestimonialUseCase.execute("vendedor-1", "https://cloudinary.com/captura1.jpg");

    const updated = await removeTestimonialUseCase.execute("vendedor-1", "https://cloudinary.com/captura1.jpg");

    expect(updated.testimonialUrls).not.toContain("https://cloudinary.com/captura1.jpg");
  });

  it("rechaza agregar una captura sin URL", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    await expect(addTestimonialUseCase.execute("vendedor-1", "")).rejects.toThrow(ValidationError);
  });

  it("rechaza agregar más de 12 capturas", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });

    for (let i = 0; i < 12; i++) {
      await addTestimonialUseCase.execute("vendedor-1", `https://cloudinary.com/captura${i}.jpg`);
    }

    await expect(
      addTestimonialUseCase.execute("vendedor-1", "https://cloudinary.com/captura13.jpg")
    ).rejects.toThrow();
  });

  // Regresión: testimonialUrls llegó a faltar en toPublicJSON()/toOwnerJSON(),
  // así que el JSON que recibía la app (y la página pública) nunca reflejaba
  // las capturas recién subidas, aunque el use case sí las guardaba bien.
  it("incluye testimonialUrls en el JSON público y del dueño (regresión)", async () => {
    await createStoreUseCase.execute({
      ownerId: "vendedor-1",
      name: "Tienda Moda",
      whatsappPhone: "584120000000",
    });
    const updated = await addTestimonialUseCase.execute("vendedor-1", "https://cloudinary.com/captura1.jpg");

    expect(updated.toPublicJSON().testimonialUrls).toContain("https://cloudinary.com/captura1.jpg");
    expect(updated.toOwnerJSON().testimonialUrls).toContain("https://cloudinary.com/captura1.jpg");
  });
});
