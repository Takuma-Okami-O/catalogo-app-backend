import { User } from "../entities/User";

/**
 * Puerto del dominio. La capa de aplicación depende de esta interfaz,
 * nunca de una implementación concreta (Postgres, Prisma, memoria, etc.)
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
