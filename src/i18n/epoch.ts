type Listener = () => void;

const listeners: Listener[] = [];

/**
 * Says "the language or the unit just changed" to whoever is holding the tree.
 *
 * The alternative was threading a locale through context and a `useT()` hook in
 * every component, which the notification scheduler and the quick-actions sync
 * cannot use — they run with no React around them and still have to produce the
 * user's language. Keeping the active language as module state lets `t` be a
 * plain function everywhere, and this one signal lets the root remount so the
 * strings already on the glass are rebuilt in the new language.
 *
 * Remounting rather than re-rendering is deliberate: it is a two-taps-a-year
 * event, and it guarantees no screen keeps a sentence it formatted earlier.
 */
export function notifyLocaleChanged(): void {
  for (const listener of listeners) listener();
}

export function subscribeLocaleChanged(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const at = listeners.indexOf(listener);
    if (at >= 0) listeners.splice(at, 1);
  };
}
