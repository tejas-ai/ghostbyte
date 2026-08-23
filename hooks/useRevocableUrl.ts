import { useCallback, useEffect, useRef } from 'react';

/**
 * Tracks one blob: URL slot and revokes it at the right moments: when it is
 * replaced by a different URL, and once when the component unmounts.
 *
 * This exists because the obvious version is wrong in a way that is easy to
 * miss. Writing the revocation as an effect cleanup and listing the URLs as
 * dependencies:
 *
 *   useEffect(() => () => {
 *     if (result) URL.revokeObjectURL(result);
 *     if (carrier) URL.revokeObjectURL(carrier.src);
 *   }, [result, carrier]);
 *
 * makes React run the cleanup on *every* dependency change, holding the
 * previous render's values. Setting `result` therefore revoked `carrier.src`
 * while the carrier was still on screen and still needed, so encoding a second
 * time with the same image failed with "Failed to process image buffer on
 * canvas" -- an error that blamed the user's file. The Forensics tab had the
 * same bug one step earlier: loading the second image revoked the first.
 *
 * Keeping the live URL in a ref, and revoking only on genuine replacement,
 * decouples it from the render cycle entirely.
 *
 * @returns `track(url)` -- call with each new URL, or null when clearing.
 */
export function useRevocableUrl(): (next: string | null) => void {
  const current = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (current.current?.startsWith('blob:')) {
        URL.revokeObjectURL(current.current);
      }
      current.current = null;
    };
  }, []);

  return useCallback((next: string | null) => {
    const prev = current.current;
    if (prev && prev !== next && prev.startsWith('blob:')) {
      URL.revokeObjectURL(prev);
    }
    current.current = next;
  }, []);
}
