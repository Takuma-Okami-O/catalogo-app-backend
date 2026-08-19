export type UserRole = "VENDEDOR" | "ADMIN";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  storeName: string;
  role: UserRole;
  createdAt: Date;
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
