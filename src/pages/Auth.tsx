// src/pages/Auth.tsx
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, googleProvider } from "../firebase/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useLoading } from "../contexts/LoadingContext";

const db = getFirestore();

export interface AuthUserData {
  type: "google" | "email";
  email: string | null;
  name: string | null;
  photoURL: string | null;
  password?: string;
}

interface AuthProps {
  onLogin: (userData: AuthUserData) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [show, setShow] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeValid, setCodeValid] = useState(false);

  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setPassword("");
    setConfirmPassword("");
  };

  // ---------- LOGIN / SIGNUP ----------

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    try {
      showLoading();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onLogin({
        type: "email",
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        password,
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) return;
    if (password !== confirmPassword) return;
    try {
      showLoading();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onLogin({
        type: "email",
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        password,
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      showLoading();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin({
        type: "google",
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  // ---------- ESQUECI MINHA SENHA ----------

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendResetCode = async () => {
  if (!email) return;
  try {
    showLoading();

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

    // Salva no Firestore
    await setDoc(doc(db, "passwordResetCodes", email), { code, expiresAt });

    // Chama sua API para enviar o e-mail
    await fetch("https://SEU_BACKEND.com/send-reset-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    setResetCodeSent(true);
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
};


  const validateCode = async () => {
    if (!email || !inputCode) return;
    try {
      showLoading();
      const docRef = doc(db, "passwordResetCodes", email);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        setCodeValid(false);
        return;
      }
      const { code, expiresAt } = snapshot.data() as any;
      if (Date.now() > expiresAt) {
        setCodeValid(false);
        return;
      }
      setCodeValid(inputCode === code);
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const updateUserPassword = async () => {
    if (!auth.currentUser || !newPassword) return;
    try {
      showLoading();
      await updatePassword(auth.currentUser, newPassword);
      alert("Senha atualizada com sucesso!");
      setIsForgotMode(false);
      setResetCodeSent(false);
      setInputCode("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  // ---------- RENDER ----------

  if (isForgotMode) {
    return (
      <Wrapper show={show}>
        <Form>
          <LogoWrapper>
            <Logo src="/images/logo.png" alt="Logo" />
          </LogoWrapper>

          <Label>Email</Label>
          <InputWrapper>
            <Input
              type="text"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputWrapper>

          {!resetCodeSent && (
            <SubmitButton type="button" onClick={sendResetCode}>
              Enviar código
            </SubmitButton>
          )}

          {resetCodeSent && (
            <>
              <Label>Código recebido</Label>
              <InputWrapper>
                <Input
                  type="text"
                  placeholder="Digite o código"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onBlur={validateCode}
                />
              </InputWrapper>

              <Label>Nova senha</Label>
              <InputWrapper>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!codeValid}
                />
                <PasswordToggle onClick={togglePassword}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </InputWrapper>

              <SubmitButton type="button" disabled={!codeValid} onClick={updateUserPassword}>
                Redefinir senha
              </SubmitButton>
            </>
          )}

          <CenteredText style={{ marginTop: 6 }}>
            <ClickableText onClick={() => setIsForgotMode(false)}>Voltar</ClickableText>
          </CenteredText>
        </Form>
      </Wrapper>
    );
  }

  return (
    <Wrapper show={show}>
      <Form>
        <LogoWrapper>
          <Logo src="/images/logo.png" alt="Logo" />
        </LogoWrapper>

        <Label>Email</Label>
        <InputWrapper>
          <Input type="text" placeholder="Digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        </InputWrapper>

        <Label>Senha</Label>
        <InputWrapper>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordToggle onClick={togglePassword}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </PasswordToggle>
        </InputWrapper>

        {isSignUpMode && (
          <>
            <Label>Confirmar senha</Label>
            <InputWrapper>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </InputWrapper>
          </>
        )}

        {!isSignUpMode && (
          <FlexRow>
            <CheckboxLabel>
              <input type="checkbox" readOnly />
              Lembrar-me
            </CheckboxLabel>
            <ForgotPassword onClick={() => setIsForgotMode(true)}>Esqueci minha senha</ForgotPassword>
          </FlexRow>
        )}

        <SubmitButton type="button" onClick={isSignUpMode ? handleEmailSignUp : handleEmailLogin}>
          {isSignUpMode ? "Criar Conta" : "Entrar"}
        </SubmitButton>

        <CenteredText style={{ marginTop: 4 }}>
          {isSignUpMode ? (
            <>
              Já possui uma conta? <ClickableText onClick={toggleMode}>Entrar</ClickableText>
            </>
          ) : (
            <>
              Não tem uma conta? <ClickableText onClick={toggleMode}>Criar Conta</ClickableText>
            </>
          )}
        </CenteredText>

        {!isSignUpMode && (
          <>
            <CenteredText line style={{ marginTop: 6, marginBottom: 6 }}>
              Ou entre com
            </CenteredText>
            <GoogleButton type="button" onClick={handleGoogleLogin}>
              <FaGoogle className="icon" /> Google
            </GoogleButton>
          </>
        )}
      </Form>
    </Wrapper>
  );
};

// --- Styled Components ---
const gradientAnim = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Wrapper = styled.div<{ show: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(270deg,#4727a0,#ffffff);
  background-size: 400% 400%;
  animation: ${gradientAnim} 10s ease infinite;
  opacity: ${(props) => (props.show ? 1 : 0)};
  transition: opacity 0.5s ease;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 30px;
  width: 450px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
`;

const LogoWrapper = styled.div`
  display:flex;justify-content:flex-start;margin-bottom:15px;user-select:none;-webkit-user-drag:none;
`;
const Logo = styled.img`height:40px;width:auto;`;
const Label = styled.label`color:#151717;font-weight:600;margin-top:6px;`;
const InputWrapper = styled.div`
  border:1.5px solid #ecedec;border-radius:10px;height:50px;display:flex;align-items:center;padding:0 10px;position:relative;margin-top:4px;
`;
const Input = styled.input`margin-left:5px;border-radius:10px;border:none;width:100%;height:100%;outline:none;`;
const PasswordToggle = styled.span`
  position:absolute;right:10px;top:50%;transform:translateY(-50%);
  cursor:pointer;font-size:1.2em;color:#888;transition:color 0.2s;
  &:hover{color:#151717;}
`;
const FlexRow = styled.div`display:flex;justify-content:space-between;align-items:center;margin-top:4px;`;
const CheckboxLabel = styled.label`display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;`;
const ForgotPassword = styled.span`font-size:14px;color:#2d79f3;cursor:pointer;`;
const SubmitButton = styled.button`
  margin:16px 0 8px 0;background-color:#151717;border:none;color:white;font-size:15px;font-weight:500;
  border-radius:10px;height:50px;width:100%;cursor:pointer;
  &:hover{background-color:#252727;}
`;
const CenteredText = styled.p<{ line?: boolean }>`
  text-align:center;color:black;font-size:14px;
`;
const ClickableText = styled.span`font-size:14px;color:#2d79f3;cursor:pointer;`;
const GoogleButton = styled.button`
  margin-top:6px;width:100%;height:50px;border-radius:10px;display:flex;
  justify-content:center;align-items:center;font-weight:500;gap:10px;
  border:1px solid #ededef;background-color:white;cursor:pointer;transition:0.2s ease-in-out;
  &:hover{border-color:#2d79f3;}
  .icon{font-size:1.2em;}
`;
