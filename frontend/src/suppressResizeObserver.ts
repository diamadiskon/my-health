// Suppress ResizeObserver errors that are harmless but noisy
const _error = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return;
  }
  _error(...args);
};

export {};