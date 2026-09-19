import { createBattlePresentationController } from './presentation-action-controller.mjs';

export function createBattlePresentationTrace(options={}) {
  return createBattlePresentationController(options);
}
