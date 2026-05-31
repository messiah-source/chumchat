import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useRegister } from '../hooks/useAuth';
import { ChumLogo } from '../components/layout/ChumLogo';

interface FormData {
  email: string;
  username: string;
  password: string;
  confirm: string;
}

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const { mutate: doRegister, isPending, error } = useRegister();

  const onSubmit = ({ email, username, password }: FormData) =>
    doRegister({ email, username, password });

  const errMsg = error
    ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
    : null;

  const errText = Array.isArray(errMsg) ? errMsg.join(', ') : errMsg;

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-light-bg-outer flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <ChumLogo />
          <ThemeToggle />
        </div>

        <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-8 shadow-cyber">
          <div className="flex gap-1 mb-6">
            <div className="w-8 h-0.5 bg-cyber-red" />
            <div className="flex-1 h-0.5 bg-cyber-cyan opacity-60" />
          </div>

          <h1 className="font-mono text-xl dark:text-cyber-text text-light-text mb-1">
            РЕГИСТРАЦИЯ
          </h1>
          <p className="font-sans text-sm dark:text-cyber-text-dim text-light-text-dim mb-6">
            Стань истинным чамером
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="vasyan@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Обязательное поле',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Неверный email' },
              })}
            />
            <Input
              label="Никнейм"
              placeholder="vasyan666"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username', {
                required: 'Обязательное поле',
                minLength: { value: 3, message: 'Минимум 3 символа' },
                maxLength: { value: 24, message: 'Максимум 24 символа' },
                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Только латиница, цифры, _ и -' },
              })}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="минимум 8 символов"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Обязательное поле',
                minLength: { value: 8, message: 'Минимум 8 символов' },
              })}
            />
            <Input
              label="Повтори пароль"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm', {
                required: 'Обязательное поле',
                validate: (v) => v === watch('password') || 'Пароли не совпадают',
              })}
            />

            {errText && (
              <div className="font-mono text-xs text-cyber-red border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 rounded-sm">
                ⚠ {errText}
              </div>
            )}

            <Button type="submit" size="lg" loading={isPending} className="mt-2 w-full">
              СТАТЬ ЧЛЕНОМ
            </Button>
          </form>

          <div className="flex items-center gap-2 my-5">
            <div className="flex-1 h-px dark:bg-cyber-border bg-light-border" />
            <span className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim">или</span>
            <div className="flex-1 h-px dark:bg-cyber-border bg-light-border" />
          </div>

          <p className="font-sans text-sm text-center dark:text-cyber-text-dim text-light-text-dim">
            Уже чамер?{' '}
            <Link to="/login" className="font-mono text-cyber-cyan hover:underline">
              Войти
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
