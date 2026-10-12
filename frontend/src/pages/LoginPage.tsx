import { useState, type FormEvent } from 'react';
import { ApiError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthFooter } from '../components/auth/AuthFooter';
import { LoginForm } from '../components/auth/LoginForm';
import { RoleQuickSelector } from '../components/auth/RoleQuickSelector';
import { TerminalStatusBar } from '../components/auth/TerminalStatusBar';

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapErrorMessage(rawError: string): string {
    if (rawError.includes('Invalid username or password')) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }
    if (rawError.includes('User account is deactivated')) {
      return 'Tài khoản người dùng đã bị vô hiệu hóa. Vui lòng liên hệ Chủ nhà thuốc.';
    }
    if (rawError.includes('Username and password are required')) {
      return 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
    }
    return rawError || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (requestError) {
      const raw = requestError instanceof ApiError ? (requestError.detail || requestError.message) : '';
      setError(mapErrorMessage(raw));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#f4f7f6]">
      {/* 1. Header Bar: System status & Compliance */}
      <AuthHeader nodeName="Node CN01 - HCM" version="v1.2.0-Prod" />

      {/* 2. Main Terminal Login Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <LoginForm
          username={username}
          password={password}
          error={error}
          isSubmitting={isSubmitting}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        >
          {/* Static role indicator text matching the mockup */}
          <RoleQuickSelector />
        </LoginForm>

        {/* POS terminal status bar below the card */}
        <TerminalStatusBar
          terminalId="POS-TERMINAL-01"
          signatureStatus="Chữ ký số: Sẵn sàng"
        />
      </main>

      {/* 3. Footer Bar: App brand & Security invariants */}
      <AuthFooter appName="PharmaSecure ERP" />
    </div>
  );
}
