import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../../../firebase/firebase";
import { isValidEmail } from "../../../core/validation/emailValidator";
import {
  canCompleteEmailSignUp,
  completeEmailSignUp,
  definePasswordForCurrentUser,
  sendEmailSignUpLink,
} from "../data/firebase-auth.repository";
import {
  clearRegistrationSession,
  readRegistrationSession,
  writeRegistrationSession,
} from "../data/registration-session.storage";
import type { RegistrationSession } from "../domain/entities/RegistrationSession";
import type { RegistrationStage } from "../domain/entities/RegistrationStage";

const RESEND_COOLDOWN_SECONDS = 30;

interface SignUpFlowState {
  readonly stage: RegistrationStage;
  readonly email: string;
  readonly busy: boolean;
  readonly cooldown: number;
  readonly feedback: string | null;
  readonly feedbackTone: "error" | "success" | "info";
}

const createInitialRegistrationSession = (): RegistrationSession => ({
  email: "",
  stage: "email_entry",
  startedAt: Date.now(),
  verificationSentAt: null,
});

const readInitialRegistrationSession = (): RegistrationSession => {
  return readRegistrationSession() ?? createInitialRegistrationSession();
};

const secondsUntilResend = (sentAt: number | null): number => {
  if (!sentAt) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);

  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

export const useSignUpFlow = () => {
  const [session, setSession] = useState<RegistrationSession>(
    readInitialRegistrationSession,
  );

  const [busy, setBusy] = useState(false);

  const [cooldown, setCooldown] = useState(() =>
    secondsUntilResend(
      readInitialRegistrationSession().verificationSentAt,
    ),
  );

  const [feedback, setFeedback] = useState<string | null>(null);

  const [feedbackTone, setFeedbackTone] = useState<
    "error" | "success" | "info"
  >("info");

  const persist = useCallback((next: RegistrationSession) => {
    setSession(next);
    writeRegistrationSession(next);
    setCooldown(secondsUntilResend(next.verificationSentAt));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  useEffect(() => {
    const currentUrl = window.location.href;

    if (!canCompleteEmailSignUp(currentUrl)) {
      return;
    }

    const storedSession = readRegistrationSession();
    const storedEmail =
      storedSession?.email.trim().toLowerCase() ?? "";

    if (!storedSession || !storedEmail) {
      setFeedbackTone("error");
      setFeedback(
        "Abra o link no mesmo navegador em que iniciou o cadastro.",
      );

      return;
    }

    setBusy(true);

    void completeEmailSignUp(storedEmail, currentUrl)
      .then(() => {
        const next: RegistrationSession = {
          email: storedEmail,
          stage: "password_setup",
          startedAt: storedSession.startedAt,
          verificationSentAt: storedSession.verificationSentAt,
        };

        persist(next);

        setFeedbackTone("success");
        setFeedback(
          "E-mail verificado. Agora defina sua senha.",
        );

        window.history.replaceState(
          {},
          document.title,
          "/sign-up",
        );
      })
      .catch((error: unknown) => {
        setFeedbackTone("error");

        setFeedback(
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar o e-mail.",
        );
      })
      .finally(() => {
        setBusy(false);
      });
  }, [persist]);

  useEffect(() => {
    if (session.stage !== "verification_pending") {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user?.emailVerified) {
        return;
      }

      const next: RegistrationSession = {
        email:
          user.email?.trim().toLowerCase() ||
          session.email.trim().toLowerCase(),
        stage: "password_setup",
        startedAt: session.startedAt,
        verificationSentAt: session.verificationSentAt,
      };

      persist(next);

      setFeedbackTone("success");
      setFeedback(
        "E-mail verificado. Agora defina sua senha.",
      );
    });

    return unsubscribe;
  }, [
    persist,
    session.email,
    session.stage,
    session.startedAt,
    session.verificationSentAt,
  ]);

  const setEmail = useCallback((email: string) => {
    setSession((currentSession) => ({
      ...currentSession,
      email,
    }));

    setFeedback(null);
  }, []);

  const sendVerification = useCallback(async () => {
    const normalizedEmail = session.email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setFeedbackTone("error");
      setFeedback("Informe um e-mail válido.");

      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      await sendEmailSignUpLink(normalizedEmail);

      const next: RegistrationSession = {
        email: normalizedEmail,
        stage: "verification_pending",
        startedAt:
          session.startedAt > 0
            ? session.startedAt
            : Date.now(),
        verificationSentAt: Date.now(),
      };

      persist(next);

      setFeedbackTone("success");
      setFeedback(
        "E-mail de verificação enviado. Verifique sua caixa de entrada e spam.",
      );
    } catch (error: unknown) {
      setFeedbackTone("error");

      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o e-mail.",
      );
    } finally {
      setBusy(false);
    }
  }, [
    persist,
    session.email,
    session.startedAt,
  ]);

  const resendVerification = useCallback(async () => {
    if (cooldown > 0 || busy) {
      return;
    }

    await sendVerification();
  }, [
    busy,
    cooldown,
    sendVerification,
  ]);

  const changeEmail = useCallback(() => {
    clearRegistrationSession();

    const next = createInitialRegistrationSession();

    setSession(next);
    setCooldown(0);
    setFeedbackTone("info");
    setFeedback(
      "Você pode alterar o e-mail e tentar novamente.",
    );
  }, []);

  const completePassword = useCallback(
    async (password: string) => {
      setBusy(true);
      setFeedback(null);

      try {
        await definePasswordForCurrentUser(password);

        clearRegistrationSession();

        setFeedbackTone("success");
        setFeedback("Senha definida com sucesso.");
      } catch (error: unknown) {
        setFeedbackTone("error");

        setFeedback(
          error instanceof Error
            ? error.message
            : "Não foi possível definir a senha.",
        );

        throw error;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const state = useMemo<SignUpFlowState>(
    () => ({
      stage: session.stage,
      email: session.email,
      busy,
      cooldown,
      feedback,
      feedbackTone,
    }),
    [
      busy,
      cooldown,
      feedback,
      feedbackTone,
      session.email,
      session.stage,
    ],
  );

  return {
    state,
    isEmailValid: isValidEmail(session.email),
    setEmail,
    sendVerification,
    resendVerification,
    changeEmail,
    completePassword,
  };
};
