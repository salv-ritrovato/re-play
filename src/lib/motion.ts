/**
 * A short fade-and-rise for things that appear in a list (cards, tiles). Only for people who have not asked
 * for reduced motion (`motion-safe`). Give each item its position in the list so they arrive one after the
 * other; the delay stops growing after a dozen so long lists do not make anyone wait.
 */
export const REVEAL =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-backwards";

export const revealDelay = (index: number) => ({ animationDelay: `${Math.min(index, 11) * 40}ms` });
