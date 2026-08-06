import type { User, UserCredential } from "firebase/auth";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../../../firebase/firebase";
import type { RegisterInput } from "../domain/auth.types";

const normalizedEmail = (value: string): string => value.trim().toLowerCase();

const verificationActionSettings = (): { url: string; handleCodeInApp: false } => ({
  url: `${window.location.origin}/verify-email`,
  handleCodeInApp: false,
});

const signUpActionSettings = (): { url: string; handleCodeInApp: true } => ({
  url: `${window.location.origin}/sign-up?finishEmailSignUp=1`,
  handleCodeInApp: true,
});

const preparePersistence = async (): Promise<void> => {
  await setPersistence(auth, browserLocalPersistence);
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  await preparePersistence();
  return signInWithEmailAndPassword(auth, normalizedEmail(email), password);
};

/**
 * Compatibilidade com o fluxo antigo. A tela oficial de cadastro usa
 * link de e-mail e só solicita senha depois da confirmação.
 */
export const registerWithEmail = async ({
  email,
  password,
  displayName,
}: RegisterInput): Promise<UserCredential> => {
  await preparePersistence();

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail(email),
    password,
  );

  const normalizedName = displayName?.trim() ?? "";
  if (normalizedName) {
    await updateProfile(credential.user, { displayName: normalizedName });
  }

  await sendVerificationEmail(credential.user);
  return credential;
};

export const sendEmailSignUpLink = async (email: string): Promise<void> => {
  await preparePersistence();
  await sendSignInLinkToEmail(auth, normalizedEmail(email), signUpActionSettings());
};

export const canCompleteEmailSignUp = (href: string): boolean =>
  isSignInWithEmailLink(auth, href);

export const completeEmailSignUp = async (
  email: string,
  href: string,
): Promise<UserCredential> => {
  await preparePersistence();
  return signInWithEmailLink(auth, normalizedEmail(email), href);
};

export const definePasswordForCurrentUser = async (password: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("A sessão de cadastro expirou. Solicite um novo link.");
  }

  await updatePassword(currentUser, password);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  await preparePersistence();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, googleProvider);
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
  await sendEmailVerification(user, verificationActionSettings());
};

export const sendResetEmail = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, normalizedEmail(email), {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
  });
};
