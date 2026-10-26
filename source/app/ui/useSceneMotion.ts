import { useEffect, useRef, useState } from 'react';
const STORAGE = 'na-sebe-scene-motion';
export function useSceneMotion() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  const [wanted, setWanted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE) !== 'off';
    } catch {
      return true;
    }
  });
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    update();
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);
  const toggle = () =>
    setWanted((value) => {
      const next = !value;
      try {
        localStorage.setItem(STORAGE, next ? 'on' : 'off');
      } catch {
        // Без доступа к хранилищу настройка действует только до перезагрузки.
      }
      return next;
    });
  const enabled = wanted && !reduced;
  const running = enabled && pageVisible && inView;
  return {
    enabled,
    mode: !enabled ? 'off' : running ? 'on' : 'suspended',
    reduced,
    toggle,
    sceneRef,
  };
}
