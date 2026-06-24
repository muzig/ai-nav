import { useState, useEffect } from 'react';

export type HealthStatus = 'online' | 'offline' | 'checking';

export function useHealthCheck(intervalMs = 30000): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const controller = new AbortController();

    const check = async () => {
      try {
        const res = await fetch('/api/health', {
          signal: controller.signal,
        });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!controller.signal.aborted) {
          setStatus('offline');
        }
      }
    };

    check();
    timer = setInterval(check, intervalMs);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [intervalMs]);

  return status;
}
