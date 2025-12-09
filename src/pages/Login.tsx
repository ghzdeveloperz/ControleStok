import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import bcrypt from "bcryptjs";
import { LogIn, User, Lock } from "lucide-react";

interface LoginProps {
    onLoginSuccess: (login: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        setError("");

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("login", "==", login.toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Login ou senha incorretos");
                return;
            }

            let userFound = false;

            for (const doc of querySnapshot.docs) {
                const data = doc.data();

                const senhaMatch = await bcrypt.compare(password, data.passwordHash);

                if (senhaMatch && (data.active ?? true)) {
                    userFound = true;
                    onLoginSuccess(data.login);
                    navigate("/estoque");
                    break;
                }
            }

            if (!userFound) setError("Login ou senha incorretos");
        } catch (err) {
            console.error("Erro ao acessar Firestore:", err);
            setError("Erro no login. Tente novamente.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-100 via-white to-blue-50 p-6">
            <div className="bg-white border border-gray-200 p-10 rounded-3xl shadow-xl w-full max-w-sm flex flex-col gap-6 animate-fadeIn select-none relative">

                {/* Logo no canto superior esquerdo
                <img
                    src="public/images/logo.png"
                    alt="Logo da Empresa"
                    className="absolute top-4 left-4 w-40 h-auto select-none pointer-events-none"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                />*/}

                {/* Título */}
                <div className="text-center pt-10"> {/* padding-top para afastar do logo */}
                    <h2 className="text-2xl font-extrabold text-gray-800 tracking-wide flex justify-center gap-2 items-center">
                        <LogIn size={28} className="text-gray-700" /> Painel de Controle
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Acesse seu estoque</p>
                </div>

                {error && (
                    <p className="text-red-700 text-sm text-center font-semibold bg-red-100 py-2 rounded-lg border border-red-300">
                        {error}
                    </p>
                )}

                {/* Campo Login */}
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="Login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none border border-gray-300"
                    />
                </div>

                {/* Campo Senha */}
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none border border-gray-300"
                    />
                </div>

                {/* Botão */}
                <button
                    onClick={handleLogin}
                    className="cursor-pointer bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-blue-700 transition-all active:scale-95"
                >
                    Entrar
                </button>

                {/* Esqueceu a senha */}
                <p className="text-center text-gray-600 text-sm">
                    Esqueceu a senha? Consulte o administrador.
                </p>
            </div>
        </div>
    );
};
