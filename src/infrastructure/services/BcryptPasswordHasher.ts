import bcrypt from "bcrypt";
import { IPasswordHasher } from "../../domain/repositories/IPasswordHasher";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    if (!plainPassword) {
      throw new Error("BcryptPasswordHasher: no se puede hashear una contraseña vacía.");
    }
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    if (!plainPassword || !hash) {
      return false;
    }
    return bcrypt.compare(plainPassword, hash);
  }
}
