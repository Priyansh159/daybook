import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status
        if (status === 401 || status === 403) return false
        return failureCount < 1
      },
    },
  },
})
