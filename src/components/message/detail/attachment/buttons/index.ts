
// Export button components with lazy loading
import { lazy } from 'react';

// Use dynamic imports to improve initial loading performance
export const DownloadButton = lazy(() => import('./DownloadButton').then(mod => ({
  default: mod.DownloadButton
})));

export const OpenButton = lazy(() => import('./OpenButton').then(mod => ({
  default: mod.OpenButton
})));

export const AccessButton = lazy(() => import('./AccessButton').then(mod => ({
  default: mod.AccessButton
})));

export const MethodToggleButton = lazy(() => import('./MethodToggleButton').then(mod => ({
  default: mod.MethodToggleButton
})));

// For static exports (non-lazy)
export { DownloadButton as DownloadButtonStatic } from './DownloadButton';
export { OpenButton as OpenButtonStatic } from './OpenButton';
export { AccessButton as AccessButtonStatic } from './AccessButton';
export { MethodToggleButton as MethodToggleButtonStatic } from './MethodToggleButton';
