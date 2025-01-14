import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  error: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || response.statusText);
    }

    return { ok: true };
  } catch (e: any) {
    return { 
      ok: false,
      error: e.message || 'An error occurred'
    };
  }
}

async function fetchUser() {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false,
    initialData: null,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  const loginMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/login', 'POST', userData),
    onSuccess: async (result) => {
      if (!result.ok) {
        throw new Error(result.error);
      }
      await queryClient.prefetchQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
        staleTime: 0
      });
    },
    onError: (error: Error) => {
      throw error;
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: async (result) => {
      if (!result.ok) {
        throw new Error(result.error);
      }
      queryClient.setQueryData(['user'], null);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: Error) => {
      throw error;
    }
  });

  const registerMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/register', 'POST', userData),
    onSuccess: async (result) => {
      if (!result.ok) {
        throw new Error(result.error);
      }
      await queryClient.prefetchQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
        staleTime: 0
      });
    },
    onError: (error: Error) => {
      throw error;
    }
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}