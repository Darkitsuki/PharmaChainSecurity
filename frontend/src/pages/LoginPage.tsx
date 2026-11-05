import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertBanner } from '../components/common';
import { AuthFooter } from '../components/auth/AuthFooter';
import { AuthHeader } from '../components/auth/AuthHeader';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/apiClient';

export function LoginPage() {
  const location = useLocation();
  const notice = typeof location.state?.notice === 'string' ? location.state.notice : '';
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapErrorMessage(rawError: string): string {
    if (rawError.includes('Invalid username or password')) return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    if (rawError.includes('User account is deactivated')) return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ người quản lý.';
    if (rawError.includes('Username and password are required')) return 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
    return rawError || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (requestError) {
      const rawError = requestError instanceof ApiError
        ? (requestError.detail || requestError.message)
        : '';
      setError(mapErrorMessage(rawError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[460px]">
          <AlertBanner type="success" message={notice} className="mb-4" />
          <LoginForm
            username={username}
            password={password}
            error={error}
            isSubmitting={isSubmitting}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
