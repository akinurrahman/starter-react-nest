import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// RTL auto-cleanup depends on detecting a global afterEach at import time.
afterEach(() => {
  cleanup();
});
