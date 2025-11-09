import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";
import { Request, Response } from "express";

admin.initializeApp();
const db = admin.firestore();

// Configure a API Key do SendGrid
sgMail.setApiKey(functions.config().sendgrid.key);

export const sendResetEmail = functions.https.onRequest(
  async (req: Request, res: Response) => {
    try {
      if (req.method !== "POST")
        return res.status(405).send({ error: "Método não permitido" });

      const { email } = req.body;
      if (!email) return res.status(400).send({ error: "Email é obrigatório" });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

      await db.collection("passwordResetCodes").doc(email).set({ code, expiresAt });

      const msg = {
        to: email,
        from: "SEU_EMAIL_VERIFICADO_NO_SENDGRID",
        subject: "Código para redefinição de senha",
        text: `Seu código para redefinir a senha é: ${code}. Válido por 5 minutos.`,
        html: `<p>Seu código para redefinir a senha é: <strong>${code}</strong>. Válido por 5 minutos.</p>`,
      };

      await sgMail.send(msg);

      return res.status(200).send({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: "Erro ao enviar email" });
    }
  }
);
