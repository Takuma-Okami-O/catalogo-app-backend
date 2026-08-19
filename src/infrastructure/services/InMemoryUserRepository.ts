import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

/**
 * Implementación en memoria. Útil para tests y para arrancar el MVP
 * antes de conectar la base de datos real (ej. Postgres/Prisma).
 * Al implementar la misma interfaz IUserRepository, se puede sustituir
 * sin tocar ni un solo caso de uso.
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  /** Solo para uso en tests: limpia el estado entre casos */
  clear(): void {
    this.users.clear();
  }
}
