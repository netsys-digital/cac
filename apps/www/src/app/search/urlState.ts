import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UrlValue = string | number | null | undefined;

/** Estado local inicializado a partir do parâmetro `key` da URL (valores fora de `allowed` caem no fallback). */
export function useUrlInitialState<T extends string = string>(
  key: string,
  fallback: NoInfer<T>,
  allowed?: readonly NoInfer<T>[],
): [T, Dispatch<SetStateAction<T>>] {
  const location = useLocation();
  return useState<T>(() => {
    const raw = new URLSearchParams(location.search).get(key);
    if (raw == null) return fallback;
    if (allowed && !allowed.includes(raw as T)) return fallback;
    return raw as T;
  });
}

export function useUrlPageState(key = 'page'): [number, Dispatch<SetStateAction<number>>] {
  const location = useLocation();
  return useState<number>(() => {
    const n = Number.parseInt(new URLSearchParams(location.search).get(key) ?? '', 10);
    return Number.isFinite(n) && n > 1 ? n : 1;
  });
}

/** Espelha `values` na query string (replace), preservando os demais parâmetros. Vazio/null remove a chave. */
export function useSyncUrlParams(values: Record<string, UrlValue>) {
  const location = useLocation();
  const navigate = useNavigate();
  const serialized = JSON.stringify(values);

  useEffect(() => {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(JSON.parse(serialized) as Record<string, UrlValue>)) {
      if (value === '' || value == null) next.delete(key);
      else next.set(key, String(value));
    }
    if (next.toString() === current.toString()) return;
    const search = next.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true, preventScrollReset: true },
    );
  }, [serialized, location.pathname, location.search, location.hash, navigate]);
}

/** Chama `reset` quando `key` muda — ignora a montagem (inclusive o duplo efeito do StrictMode). */
export function useResetOnChange(key: string, reset: () => void) {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
