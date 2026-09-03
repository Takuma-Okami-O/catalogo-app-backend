import Anthropic from "@anthropic-ai/sdk";
import { AgentConversation } from "../../domain/entities/AgentConversation";
import { Store } from "../../domain/entities/Store";
import { IProductRepository } from "../../domain/repositories/ICatalogRepositories";
import { IAgentService } from "../../domain/services/IAgentService";

const MODEL = "claude-sonnet-4-6";

/**
 * Definición de las tools que el modelo puede invocar. El nombre y el
 * input_schema son literalmente lo que Claude ve para decidir cuándo y
 * cómo llamarlas — deben ser descriptivos, no solo nombres técnicos.
 */
const TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_productos",
    description:
      "Busca productos disponibles en el catálogo de la tienda por nombre, categoría o descripción aproximada. " +
      "Úsala siempre que el cliente pregunte por algo que vender, aunque sea de forma vaga (ej. 'algo para regalar').",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Palabra o frase para buscar (nombre o categoría del producto)." },
      },
      required: ["query"],
    },
  },
  {
    name: "verificar_stock",
    description: "Verifica la disponibilidad/stock actual de un producto específico por su ID.",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
  },
  {
    name: "agregar_al_carrito",
    description:
      "Agrega un producto al carrito de compra del cliente en esta conversación. " +
      "Solo úsala cuando el cliente confirme explícitamente que quiere ese producto, no antes.",
    input_schema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        quantity: { type: "integer", minimum: 1 },
      },
      required: ["productId", "quantity"],
    },
  },
];

function systemPrompt(store: Store): string {
  return [
    `Eres el asistente de ventas de la tienda "${store.name}" dentro de Catálogo App.`,
    "Ayudas a los clientes a encontrar productos y armar su pedido de forma natural y breve.",
    "Reglas importantes:",
    "- Usa SIEMPRE la herramienta buscar_productos antes de afirmar qué hay o no hay disponible; nunca inventes productos ni precios.",
    "- Si un producto no tiene stock o no está disponible, dilo claramente y ofrece alternativas.",
    "- Solo agrega productos al carrito cuando el cliente lo confirme explícitamente.",
    "- Al final de cada respuesta con productos, sé breve: nombre, precio, y una línea de por qué le serviría.",
    "- Responde siempre en español, con tono cercano pero profesional.",
  ].join("\n");
}

export class AnthropicAgentService implements IAgentService {
  private client: Anthropic;

  constructor(private readonly productRepository: IProductRepository, apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Corre el turno completo: manda el mensaje del comprador, ejecuta las tools
   * que el modelo pida (contra el catálogo real de la tienda) y devuelve el
   * texto final. Muta `conversation` (mensajes + carrito) directamente;
   * el caller es responsable de persistirla después.
   */
  async handleTurn(conversation: AgentConversation, store: Store, userMessage: string): Promise<string> {
    conversation.addMessage("user", userMessage);

    const messages: Anthropic.MessageParam[] = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // El loop de tool-use: Claude puede pedir varias tools antes de dar la
    // respuesta final. Cortamos en 5 vueltas como salvaguarda contra loops.
    for (let turn = 0; turn < 5; turn++) {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt(store),
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason !== "tool_use") {
        const finalText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");
        conversation.addMessage("assistant", finalText);
        return finalText;
      }

      // Guarda el turno del asistente (incluye los tool_use blocks) y ejecuta cada tool.
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const result = await this.executeTool(block.name, block.input as Record<string, unknown>, conversation, store);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: "user", content: toolResults });
    }

    const fallback = "Disculpa, tuve un problema procesando tu solicitud. ¿Puedes reformularla?";
    conversation.addMessage("assistant", fallback);
    return fallback;
  }

  private async executeTool(
    name: string,
    input: Record<string, unknown>,
    conversation: AgentConversation,
    store: Store
  ): Promise<unknown> {
    switch (name) {
      case "buscar_productos": {
        const query = String(input.query ?? "").toLowerCase();
        const products = await this.productRepository.findByStoreId(store.id);
        const matches = products
          .filter((p) => p.isEffectivelyAvailable)
          .filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
          .slice(0, 8)
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            stockCount: p.stockCount,
          }));
        return { count: matches.length, products: matches };
      }

      case "verificar_stock": {
        const productId = String(input.productId ?? "");
        const product = await this.productRepository.findById(productId);
        if (!product || product.storeId !== store.id) {
          return { found: false };
        }
        return {
          found: true,
          available: product.isEffectivelyAvailable,
          stockCount: product.stockCount,
        };
      }

      case "agregar_al_carrito": {
        const productId = String(input.productId ?? "");
        const quantity = Number(input.quantity ?? 1);
        const product = await this.productRepository.findById(productId);
        if (!product || product.storeId !== store.id) {
          return { success: false, reason: "Producto no encontrado en esta tienda." };
        }
        if (!product.isEffectivelyAvailable) {
          return { success: false, reason: "Producto sin stock disponible." };
        }
        conversation.addToCart({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
        });
        return { success: true, cart: conversation.cart, cartTotal: conversation.cartTotal() };
      }

      default:
        return { error: `Tool desconocida: ${name}` };
    }
  }
}
