import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authApi.login(login, password),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/chat');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, username, password }: { email: string; username: string; password: string }) =>
      authApi.register(email, username, password),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      navigate('/chat');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      qc.clear();
      navigate('/');
    },
    onError: () => {
      clearAuth();
      navigate('/');
    },
  });
}
