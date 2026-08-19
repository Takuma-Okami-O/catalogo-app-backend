export type OrderStatus = "PENDIENTE" | "CONFIRMADO" | "ENTREGADO" | "CANCELADO";

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderProps {
  id: string;
  storeId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  buyerContact: string | null; // opcional: teléfono/nombre del comprador si se captura
  createdAt: Date;
}

export class Order {
  private constructor(private props: OrderProps) {}

  static create(props: Omit<OrderProps, "total">): Order {
    if (props.items.length === 0) {
      throw new Error("Order: un pedido debe tener al menos un producto.");
    }
    const total = props.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return new Order({ ...props, total });
  }

  get id() { return this.props.id; }
  get storeId() { return this.props.storeId; }
  get items() { return this.props.items; }
  get total() { return this.props.total; }
  get status() { return this.props.status; }
  get createdAt() { return this.props.createdAt; }

  updateStatus(newStatus: OrderStatus): void {
    this.props.status = newStatus;
  }

  /** Construye el texto del mensaje de WhatsApp a partir del pedido. El REF-XXXX
   *  es información interna del vendedor y NUNCA debe aparecer en este mensaje,
   *  porque el comprador lo ve (y lo envía) directamente por WhatsApp. */
  toWhatsAppMessage(storeName: string, template: string): string {
    const lines = this.props.items
      .map((i) => `▪️ *${i.quantity}x* ${i.productName} - $${(i.unitPrice * i.quantity).toFixed(2)}`)
      .join("\n");

    return template
      .replace("{storeName}", storeName)
      .replace("{items}", lines)
      .replace("{total}", this.props.total.toFixed(2));
  }

  toJSON() {
    return {
      id: this.props.id,
      storeId: this.props.storeId,
      items: this.props.items,
      total: this.props.total,
      status: this.props.status,
      createdAt: this.props.createdAt,
    };
  }
}
