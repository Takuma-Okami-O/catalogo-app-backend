import { randomUUID } from "node:crypto";
import { Order, OrderItem } from "../../domain/entities/Order";
import {
  IOrderRepository,
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import { EmptyOrderError, StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export interface CreateOrderInput {
  storeSlug: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateOrderOutput {
  order: ReturnType<Order["toJSON"]>;
  whatsappLink: string;
}

/**
 * Este caso de uso reemplaza la función `enviarPedidoWhatsApp()` de la
 * maqueta original: en vez de solo abrir WhatsApp y perder el pedido,
 * primero lo persiste (historial para el vendedor) y LUEGO genera el
 * link de WhatsApp con el mensaje ya armado.
 */
export class CreateOrderUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    if (!input.items || input.items.length === 0) {
      throw new EmptyOrderError();
    }

    const store = await this.storeRepository.findBySlug(input.storeSlug);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const orderItems: OrderItem[] = [];

    for (const line of input.items) {
      if (line.quantity <= 0) {
        throw new ValidationError("La cantidad de cada producto debe ser mayor a 0.");
      }

      const product = await this.productRepository.findById(line.productId);
      if (!product || product.storeId !== store.id) {
        throw new ValidationError(`El producto ${line.productId} no pertenece a esta tienda.`);
      }
      if (!product.available) {
        throw new ValidationError(`"${product.name}" ya no está disponible.`);
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: line.quantity,
      });
    }

    const order = Order.create({
      id: randomUUID(),
      storeId: store.id,
      items: orderItems,
      status: "PENDIENTE",
      buyerContact: null,
      createdAt: new Date(),
    });

    await this.orderRepository.save(order);

    const message = order.toWhatsAppMessage(store.name, store.whatsappMessageTemplate);
    const whatsappLink = `https://wa.me/${store.whatsappPhone}?text=${encodeURIComponent(message)}`;

    return { order: order.toJSON(), whatsappLink };
  }
}
