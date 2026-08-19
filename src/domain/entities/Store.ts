export type PlanType = "FREE" | "PREMIUM";

/**
 * Límites de negocio por plan. Viven en el dominio porque son una regla
 * de negocio, no un detalle de infraestructura. El SuperAdmin puede
 * ajustar los valores por defecto vía GlobalConfig (ver GlobalConfig.ts),
 * pero la ENTIDAD es quien decide si un plan puede o no agregar más productos.
 */
export const DEFAULT_PLAN_LIMITS: Record<PlanType, number> = {
  FREE: 30,
  PREMIUM: 1000,
};

export interface StoreProps {
  id: string;
  ownerId: string; // referencia al User (vendedor) dueño de la tienda
  name: string;
  slug: string; // parte única del link público: /catalogo/:slug
  logoUrl: string | null;
  whatsappPhone: string;
  whatsappMessageTemplate: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  testimonialUrls: string[];
  currency: "USD" | "EUR" | "VES";
  plan: PlanType;
  planExpiresAt: Date | null; // null = FREE indefinido, o PREMIUM sin corte aún
  productLimit: number; // permite override individual del límite del plan
  hasUsedTrial: boolean; // evita que una tienda active la prueba gratis más de una vez
  templateId: string; // qué plantilla visual usa el catálogo público (Premium puede elegir)
  rif: string | null; // cédula/registro fiscal, lo agrega el super admin manualmente
  isVerified: boolean; // check verde de "verificado", lo activa el super admin manualmente
  createdAt: Date;
}

export class Store {
  private constructor(private props: StoreProps) {}

  static create(props: StoreProps): Store {
    if (!props.slug || !/^[a-z0-9-]+$/.test(props.slug)) {
      throw new Error(
        "Store: el slug solo puede contener minúsculas, números y guiones."
      );
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Store: el nombre del emprendimiento es obligatorio.");
    }
    return new Store(props);
  }

  get id() { return this.props.id; }
  get ownerId() { return this.props.ownerId; }
  get name() { return this.props.name; }
  get slug() { return this.props.slug; }
  get logoUrl() { return this.props.logoUrl; }
  get whatsappPhone() { return this.props.whatsappPhone; }
  get whatsappMessageTemplate() { return this.props.whatsappMessageTemplate; }
  get instagramUrl() { return this.props.instagramUrl; }
  get tiktokUrl() { return this.props.tiktokUrl; }
  get testimonialUrls() { return this.props.testimonialUrls; }

  /** Agrega una captura de comprador. Límite razonable para no saturar la página pública. */
  addTestimonial(imageUrl: string): void {
    const MAX_TESTIMONIALS = 12;
    if (this.props.testimonialUrls.length >= MAX_TESTIMONIALS) {
      throw new Error(`Store: solo puedes tener hasta ${MAX_TESTIMONIALS} capturas de compradores.`);
    }
    this.props.testimonialUrls = [...this.props.testimonialUrls, imageUrl];
  }

  removeTestimonial(imageUrl: string): void {
    this.props.testimonialUrls = this.props.testimonialUrls.filter((url) => url !== imageUrl);
  }
  get currency() { return this.props.currency; }
  get plan() { return this.props.plan; }
  get productLimit() { return this.props.productLimit; }
  get hasUsedTrial() { return this.props.hasUsedTrial; }
  get planExpiresAt() { return this.props.planExpiresAt; }
  get templateId() { return this.props.templateId; }
  get rif() { return this.props.rif; }
  get isVerified() { return this.props.isVerified; }

  /** Solo el super admin puede marcar una tienda como verificada y asignarle su RIF. */
  setVerification(input: { rif: string | null; isVerified: boolean }): void {
    this.props.rif = input.rif;
    this.props.isVerified = input.isVerified;
  }

  /** Solo las tiendas PREMIUM pueden elegir una plantilla distinta a la clásica. */
  changeTemplate(templateId: string): void {
    if (this.props.plan !== "PREMIUM") {
      throw new Error("Store: elegir una plantilla distinta es una función exclusiva del plan Premium.");
    }
    this.props.templateId = templateId;
  }
  get createdAt() { return this.props.createdAt; }

  /** Activa una prueba gratis de Premium por 7 días. Solo se puede usar una vez por tienda. */
  startFreeTrial(): void {
    if (this.props.hasUsedTrial) {
      throw new Error("Store: esta tienda ya usó su prueba gratis de Premium.");
    }
    this.props.plan = "PREMIUM";
    this.props.productLimit = DEFAULT_PLAN_LIMITS.PREMIUM;
    this.props.planExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.props.hasUsedTrial = true;
  }

  /** ¿Puede esta tienda agregar un producto más dado su plan actual? */
  canAddProduct(currentProductCount: number): boolean {
    return currentProductCount < this.props.productLimit;
  }

  changePlan(newPlan: PlanType, newLimit: number, expiresAt: Date | null): void {
    this.props.plan = newPlan;
    this.props.productLimit = newLimit;
    this.props.planExpiresAt = expiresAt;
  }

  updateBranding(input: { name?: string; logoUrl?: string | null }): void {
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new Error("Store: el nombre no puede quedar vacío.");
      }
      this.props.name = input.name.trim();
    }
    if (input.logoUrl !== undefined) {
      this.props.logoUrl = input.logoUrl;
    }
  }

  updateSettings(input: {
    whatsappPhone?: string;
    whatsappMessageTemplate?: string;
    currency?: StoreProps["currency"];
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
  }): void {
    if (input.whatsappPhone !== undefined) this.props.whatsappPhone = input.whatsappPhone;
    if (input.whatsappMessageTemplate !== undefined) {
      this.props.whatsappMessageTemplate = input.whatsappMessageTemplate;
    }
    if (input.currency !== undefined) this.props.currency = input.currency;
    if (input.instagramUrl !== undefined) this.props.instagramUrl = input.instagramUrl;
    if (input.tiktokUrl !== undefined) this.props.tiktokUrl = input.tiktokUrl;
  }

  toPublicJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug,
      logoUrl: this.props.logoUrl,
      currency: this.props.currency,
      whatsappPhone: this.props.whatsappPhone,
      instagramUrl: this.props.instagramUrl,
      tiktokUrl: this.props.tiktokUrl,
      templateId: this.props.templateId,
      rif: this.props.rif,
      isVerified: this.props.isVerified,
      testimonialUrls: this.props.testimonialUrls,
    };
  }

  toOwnerJSON() {
    return {
      ...this.toPublicJSON(),
      whatsappMessageTemplate: this.props.whatsappMessageTemplate,
      plan: this.props.plan,
      productLimit: this.props.productLimit,
      hasUsedTrial: this.props.hasUsedTrial,
      planExpiresAt: this.props.planExpiresAt,
      createdAt: this.props.createdAt,
    };
  }

  toAdminJSON() {
    return { ...this.toOwnerJSON(), ownerId: this.props.ownerId };
  }
}
