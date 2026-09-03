import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration, Content } from "@google/genai";
import { AgentConversation } from "../../domain/entities/AgentConversation";
import { Store } from "../../domain/entities/Store";
import { IProductRepository } from "../../domain/repositories/ICatalogRepositories";
import { IAgentService } from "../../domain/services/IAgentService";

// "gemini-2.5-flash" es el modelo estable con function calling bien soportado
// en el free tier. Los modelos "gemini-3-*-preview" exigen reenviar un
// "thought_signature" en cada turno o la API rechaza la petición — evitamos
// esa complejidad extra usando el modelo estable.
const MODEL = "gemini-2.5-flash";

/** Mismo contrato de tools que en AnthropicAgentService, solo cambia el nombre
 *  del campo de esquema (`parametersJsonSchema` en vez de `input_schema`). */
const TOOLS: FunctionDeclaration[] = [
  {
    name: "buscar_productos",
    description:
      "Busca productos disponibles en el catálogo de la tienda por nombre, categoría o descripción aproximada. " +
      "Úsala siempre que el cliente pregunte por algo que vender, aunque sea de forma vaga (ej. 'algo para regalar').",
    parametersJsonSchema: {
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
    parametersJsonSchema: {
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
    parametersJsonSchema: {
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

export class GeminiAgentService implements IAgentService {
  private ai: GoogleGenAI;

  constructor(private readonly productRepository: IProductRepository, apiKey?: string) {
    this.ai = new GoogleGenAI({ apiKey: apiKey ?? process.env.GEMINI_API_KEY });
  }

  async handleTurn(conversation: AgentConversation, store: Store, userMessage: string): Promise<string> {
    conversation.addMessage("user", userMessage);

    const contents: Content[] = conversation.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Igual que en AnthropicAgentService: máximo 5 vueltas de tool-use como
    // salvaguarda, y ejecutamos las tools contra el catálogo real.
    for (let turn = 0; turn < 5; turn++) {
      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt(store),
          tools: [{ functionDeclarations: TOOLS }],
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        },
      });

      const functionCalls = response.functionCalls ?? [];
      if (functionCalls.length === 0) {
        const finalText = response.text ?? "";
        conversation.addMessage("assistant", finalText);
        return finalText;
      }

      // Se reenvía el content completo tal cual lo devolvió el modelo (no
      // reconstruido a mano) porque puede incluir metadata interna (ej.
      // thought signatures) que la API espera de vuelta sin modificar.
      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const responseParts = [];
      for (const call of functionCalls) {
        const result = await this.executeTool(call.name ?? "", (call.args ?? {}) as Record<string, unknown>, conversation, store);
        responseParts.push({
          functionResponse: { name: call.name, response: { output: result }, id: call.id },
        });
      }
      contents.push({ role: "user", parts: responseParts });
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
          .map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price, stockCount: p.stockCount }));
        return { count: matches.length, products: matches };
      }

      case "verificar_stock": {
        const productId = String(input.productId ?? "");
        const product = await this.productRepository.findById(productId);
        if (!product || product.storeId !== store.id) return { found: false };
        return { found: true, available: product.isEffectivelyAvailable, stockCount: product.stockCount };
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
        conversation.addToCart({ productId: product.id, productName: product.name, unitPrice: product.price, quantity });
        return { success: true, cart: conversation.cart, cartTotal: conversation.cartTotal() };
      }

      default:
        return { error: `Tool desconocida: ${name}` };
    }
  }
}
