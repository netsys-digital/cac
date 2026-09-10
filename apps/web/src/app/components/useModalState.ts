import { useCallback, useState } from 'react';
import type { ModalMode } from './Modal';

type ModalState<T> = {
  open: boolean;
  mode: ModalMode;
  item: T | null;
};

const closed = <T,>(): ModalState<T> => ({ open: false, mode: 'view', item: null });

export function useModalState<T>() {
  const [state, setState] = useState<ModalState<T>>(closed);

  const openView = useCallback((item: T) => {
    setState({ open: true, mode: 'view', item });
  }, []);

  const openEdit = useCallback((item: T) => {
    setState({ open: true, mode: 'edit', item });
  }, []);

  const openCreate = useCallback(() => {
    setState({ open: true, mode: 'create', item: null });
  }, []);

  const close = useCallback(() => {
    setState(closed());
  }, []);

  const setMode = useCallback((mode: ModalMode) => {
    setState((prev) => (prev.open ? { ...prev, mode } : prev));
  }, []);

  return {
    ...state,
    openView,
    openEdit,
    openCreate,
    close,
    setMode,
  };
}
