import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useLogin } from '../hooks/useAuth';
import { ChumLogo } from '../components/layout/ChumLogo';

interface FormData {
  login: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const { mutate: login, isPending, error } = useLogin();

  const onSubmit = (data: FormData) => login(data);

  const errMsg = error
    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Ошибка входа'
    : null;

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-light-bg-outer flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <ChumLogo />
          <ThemeToggle />
        </div>

        {/* Panel */}
        <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-8 shadow-cyber">
          {/* Decorative top bar */}
          <div className="flex gap-1 mb-6">
            <div className="flex-1 h-0.5 bg-cyber-cyan opacity-60" />
            <div className="w-8 h-0.5 bg-cyber-red" />
          </div>

          <h1 className="font-mono text-xl dark:text-cyber-text text-light-text mb-1">
            ИДЕНТИФИКАЦИЯ
          </h1>
          <p className="font-sans text-sm dark:text-cyber-text-dim text-light-text-dim mb-6">
            Введи ник или email и пароль
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Ник / Email"
              placeholder="vasyan666 или mail@example.com"
              autoComplete="username"
              error={errors.login?.message}
              {...register('login', { required: 'Обязательное поле' })}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'Обязательное поле' })}
            />

            {errMsg && (
              <div className="font-mono text-xs text-cyber-red border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 rounded-sm">
                ⚠ {errMsg}
              </div>
            )}

            <Button type="submit" size="lg" loading={isPending} className="mt-2 w-full">
              ВОЙТИ
            </Button>
          </form>

          <div className="flex items-center gap-2 my-5">
            <div className="flex-1 h-px dark:bg-cyber-border bg-light-border" />
            <span className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim">или</span>
            <div className="flex-1 h-px dark:bg-cyber-border bg-light-border" />
          </div>

          <p className="font-sans text-sm text-center dark:text-cyber-text-dim text-light-text-dim">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-mono text-cyber-cyan hover:underline">
              Стать членом
            </Link>
          </p>
        </div>

        <p className="font-mono text-xs text-center dark:text-cyber-text-muted text-light-text-dim mt-4">
          CHUM.CHAT © 2024 · Все права засейвлены
        </p>
      </div>
    </div>
  );
}
