export type MediaSource = "video" | "music" | "global-video" | "background-music";

export function requestPlayback(source: MediaSource) {
  window.dispatchEvent(
    new CustomEvent("mediaPauseRequest", { detail: { except: source } })
  );
}

export function onPauseRequest(
  source: MediaSource,
  callback: () => void
): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.except !== source) {
      callback();
    }
  };
  window.addEventListener("mediaPauseRequest", handler);
  return () => window.removeEventListener("mediaPauseRequest", handler);
}
