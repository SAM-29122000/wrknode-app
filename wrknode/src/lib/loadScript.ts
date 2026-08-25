const cache = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existing = cache.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.onload = () => resolve();
    script.onerror = () => {
      cache.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.body.appendChild(script);
  });

  cache.set(src, promise);
  return promise;
}
