export type AgentMessageRole = "user" | "assistant";

export interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  createdAt: Date;
}

export interface AgentCartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface AgentConversationProps {
  id: string;
  storeId: string;
  /** Identifica al comprador dentro de la tienda (ej. su número de WhatsApp o un id de sesión web). */
  buyerSessionId: string;
  messages: AgentMessage[];
  cart: AgentCartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_HISTORY_MESSAGES = 20;

/**
 * Conversación entre un comprador y el agente de ventas de IA de una tienda.
 * El carrito vive aquí (no en Order) porque todavía es un borrador: solo se
 * convierte en Order real cuando el comprador confirma el pedido.
 */
export class AgentConversation {
  private constructor(private props: AgentConversationProps) {}

  static create(props: Omit<AgentConversationProps, "messages" | "cart" | "updatedAt">): AgentConversation {
    return new AgentConversation({
      ...props,
      messages: [],
      cart: [],
      updatedAt: props.createdAt,
    });
  }

  static restore(props: AgentConversationProps): AgentConversation {
    return new AgentConversation(props);
  }

  get id() { return this.props.id; }
  get storeId() { return this.props.storeId; }
  get buyerSessionId() { return this.props.buyerSessionId; }
  get messages() { return this.props.messages; }
  get cart() { return this.props.cart; }
  get updatedAt() { return this.props.updatedAt; }

  addMessage(role: AgentMessageRole, content: string): void {
    this.props.messages.push({ role, content, createdAt: new Date() });
    // Recorta el historial que se manda al modelo para no disparar costo/latencia
    // en conversaciones largas. La conversación completa igual queda persistida.
    if (this.props.messages.length > MAX_HISTORY_MESSAGES) {
      this.props.messages = this.props.messages.slice(-MAX_HISTORY_MESSAGES);
    }
    this.props.updatedAt = new Date();
  }

  addToCart(item: AgentCartItem): void {
    const existing = this.props.cart.find((c) => c.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.props.cart.push(item);
    }
    this.props.updatedAt = new Date();
  }

  clearCart(): void {
    this.props.cart = [];
    this.props.updatedAt = new Date();
  }

  cartTotal(): number {
    return this.props.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }

  toJSON() {
    return {
      id: this.props.id,
      storeId: this.props.storeId,
      buyerSessionId: this.props.buyerSessionId,
      messages: this.props.messages,
      cart: this.props.cart,
      cartTotal: this.cartTotal(),
      updatedAt: this.props.updatedAt,
    };
  }
}
