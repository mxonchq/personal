import { DependencyList, EffectCallback, useEffect } from 'react';

export function useDebouncedEffect(effect: EffectCallback, deps: DependencyList, delay: number) {
  useEffect(() => {
    let cleanup: void | (() => void);
    const handle = setTimeout(() => {
      cleanup = effect();
    }, delay);

    return () => {
      clearTimeout(handle);
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
