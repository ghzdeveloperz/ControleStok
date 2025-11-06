// src/pages/Auth.tsx
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useLoading } from "../contexts/LoadingContext";

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
  const [showPassword, setShowPassword] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // inicia fade-in
    const timeout = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) return alert("Preencha email e senha");
    try {
      showLoading();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await fadeOutAndLogin({
        type: "email",
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        password,
      });
    } catch (error: any) {
      console.error("Erro ao logar com email:", error);
      alert(error.message);
    } finally {
      hideLoading();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      showLoading();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await fadeOutAndLogin({
        type: "google",
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      hideLoading();
    }
  };

  // função para controlar fade-out antes de chamar onLogin
  const fadeOutAndLogin = (userData: AuthUserData) => {
    return new Promise<void>((resolve) => {
      setShow(false); // inicia fade-out
      setTimeout(() => {
        onLogin(userData); // volta para AppContent
        resolve();
      }, 500); // duração igual ao transition do Wrapper
    });
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <Wrapper show={show}>
      <Form onSubmit={(e) => e.preventDefault()}>
        <LogoWrapper>
          <Logo src="/images/logo.png" alt="Logo" draggable={false} />
        </LogoWrapper>

        <Label>Email</Label>
        <InputWrapper>
          <Input type="text" placeholder="Enter your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </InputWrapper>

        <Label>Password</Label>
        <InputWrapper>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordToggle onClick={togglePassword}>{showPassword ? <FaEyeSlash /> : <FaEye />}</PasswordToggle>
        </InputWrapper>

        <FlexRow>
          <CheckboxLabel>
            <input type="checkbox" readOnly />
            Remember me?
          </CheckboxLabel>
          <ForgotPassword>Forgot password?</ForgotPassword>
        </FlexRow>

        <SubmitButton type="button" onClick={handleEmailLogin}>
          Sign In
        </SubmitButton>

        <CenteredText>
          Don't have an account? <ClickableText>Sign Up</ClickableText>
        </CenteredText>

        <CenteredText line>Or With</CenteredText>

        <FlexCol>
          <GoogleButton type="button" onClick={handleGoogleLogin}>
            <FaGoogle className="icon" /> Google
          </GoogleButton>
        </FlexCol>
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
  gap: 10px;
  background-color: #fff;
  padding: 30px;
  width: 450px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;
`;

const LogoWrapper = styled.div`
  display:flex;justify-content:flex-start;margin-bottom:20px;user-select:none;-webkit-user-drag:none;
`;
const Logo = styled.img`height:40px;width:auto;`;
const Label = styled.label`color:#151717;font-weight:600;`;
const InputWrapper = styled.div`
  border:1.5px solid #ecedec;border-radius:10px;height:50px;display:flex;align-items:center;padding:0 10px;position:relative;
`;
const Input = styled.input`margin-left:5px;border-radius:10px;border:none;width:100%;height:100%;outline:none;`;
const PasswordToggle = styled.span`
  position:absolute;right:10px;top:50%;transform:translateY(-50%);
  cursor:pointer;font-size:1.2em;color:#888;transition:color 0.2s;
  &:hover{color:#151717;}
`;
const FlexRow = styled.div`display:flex;justify-content:space-between;align-items:center;`;
const CheckboxLabel = styled.label`display:flex;align-items:center;gap:8px;cursor:pointer;`;
const ForgotPassword = styled.span`font-size:14px;color:#2d79f3;cursor:pointer;`;
const SubmitButton = styled.button`
  margin:20px 0 10px 0;background-color:#151717;border:none;color:white;font-size:15px;font-weight:500;
  border-radius:10px;height:50px;width:100%;cursor:pointer;
  &:hover{background-color:#252727;}
`;
const CenteredText = styled.p<{ line?: boolean }>`
  text-align:center;color:black;font-size:14px;margin:5px 0;
  ${(props) => props.line && `margin-top:10px;`}
`;
const ClickableText = styled.span`font-size:14px;color:#2d79f3;cursor:pointer;`;
const FlexCol = styled.div`display:flex;flex-direction:column;`;
const GoogleButton = styled.button`
  margin-top:10px;width:100%;height:50px;border-radius:10px;display:flex;
  justify-content:center;align-items:center;font-weight:500;gap:10px;
  border:1px solid #ededef;background-color:white;cursor:pointer;transition:0.2s ease-in-out;
  &:hover{border-color:#2d79f3;}
  .icon{font-size:1.2em;}
`;
