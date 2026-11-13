/**
 * A ticker driven by a dedicated Web Worker. Timers inside workers are not
 * throttled as aggressively as main-thread timers when the tab is hidden,
 * which keeps the study timer and the music scheduler accurate in the
 * background. Falls back to setInterval when workers are unavailable.
 */

const WORKER_SRC = `
let id = null;
onmessage = (e) => {
  if (e.data && e.data.cmd === "start") {
    clearInterval(id);
    id = setInterval(() => postMessage(0), e.data.ms);
  } else {
    clearInterval(id);
    id = null;
  }
};
`;

let workerUrl: string | null = null;

export function createTicker(intervalMs: number, onTick: () => void) {
  let worker: Worker | null = null;
  let fallback: ReturnType<typeof setInterval> | null = null;

  try {
    if (typeof Worker !== "undefined") {
      workerUrl ??= URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
      worker = new Worker(workerUrl);
      worker.onmessage = () => onTick();
      worker.postMessage({ cmd: "start", ms: intervalMs });
    }
  } catch {
    worker = null;
  }

  if (!worker) {
    fallback = setInterval(onTick, intervalMs);
  }

  return () => {
    if (worker) {
      worker.postMessage({ cmd: "stop" });
      worker.terminate();
    }
    if (fallback) clearInterval(fallback);
  };
}
