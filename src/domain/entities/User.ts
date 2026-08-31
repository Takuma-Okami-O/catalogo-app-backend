export type UserRole = "VENDEDOR" | "ADMIN";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  storeName: string;
  role: UserRole;
  createdAt: Date;
  passwordResetCodeHash: string | null;
  passwordResetExpiresAt: Date | null;
}

/**
 * Entidad de dominio. No conoce JWT, bcrypt, ni HTTP.
 * Encapsula únicamente las reglas de negocio del Usuario.
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (!props.email.includes("@")) {
      throw new Error("Email con formato inválido dentro de la entidad User.");
    }
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get storeName(): string {
    return this.props.storeName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get passwordResetCodeHash(): string | null {
    return this.props.passwordResetCodeHash;
  }

  get passwordResetExpiresAt(): Date | null {
    return this.props.passwordResetExpiresAt;
  }

  /** Genera un código nuevo de recuperación (el use case lo hashea antes de pasarlo aquí). */
  setPasswordResetCode(codeHash: string, expiresAt: Date): void {
    this.props.passwordResetCodeHash = codeHash;
    this.props.passwordResetExpiresAt = expiresAt;
  }

  /** Se llama después de usar el código con éxito, o si expiró. */
  clearPasswordResetCode(): void {
    this.props.passwordResetCodeHash = null;
    this.props.passwordResetExpiresAt = null;
  }

  /** true si hay un código pendiente y todavía no vence. */
  hasValidPendingResetCode(): boolean {
    return (
      this.props.passwordResetCodeHash !== null &&
      this.props.passwordResetExpiresAt !== null &&
      this.props.passwordResetExpiresAt.getTime() > Date.now()
    );
  }

  /** El use case ya validó el código antes de llamar esto. */
  updatePasswordHash(newHash: string): void {
    this.props.passwordHash = newHash;
    this.clearPasswordResetCode();
  }

  /** Representación segura para exponer al exterior (nunca expone el hash) */
  toPublicJSON() {
    return {
      id: this.props.id,
      email: this.props.email,
      storeName: this.props.storeName,
      role: this.props.role,
      createdAt: this.props.createdAt,
    };
  }
}
