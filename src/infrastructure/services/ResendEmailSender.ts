import { Resend } from "resend";
import { IEmailSender } from "../../domain/repositories/IEmailSender";

/**
 * Envía correos transaccionales vía Resend (https://resend.com).
 * Necesita la variable de entorno RESEND_API_KEY.
 * El remitente (RESEND_FROM_EMAIL) debe ser un dominio verificado en tu
 * cuenta de Resend, o usar el genérico "onboarding@resend.dev" mientras
 * pruebas (solo entrega a la propia cuenta de Resend registrada).
 */
export class ResendEmailSender implements IEmailSender {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendPasswordResetEmail(input: { to: string; storeName: string; code: string }): Promise<void> {
    const platformName = process.env.PLATFORM_NAME || "Catálogo App";

    await this.resend.emails.send({
      from: this.fromEmail,
      to: input.to,
      subject: `Tu código para recuperar tu contraseña — ${platformName}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a;">Recupera tu contraseña</h2>
          <p>Hola${input.storeName ? ` ${input.storeName}` : ""},</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en ${platformName}. Usa este código en la app:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f2efe9; padding: 16px; border-radius: 10px;">
            ${input.code}
          </p>
          <p style="color: #86868B; font-size: 13px;">Este código vence en 15 minutos. Si no fuiste tú quien lo solicitó, ignora este correo — tu contraseña seguirá siendo la misma.</p>
        </div>
      `,
    });
  }
}
