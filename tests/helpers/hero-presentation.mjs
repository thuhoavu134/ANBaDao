import { BATTLE_HERO_BODY_HEIGHT, heroPresentationFor, paintHeroSprite, projectHeroBody } from '../../src/render/hero-presentation.mjs';
import { loadHeroPresentations } from '../../scripts/hero-presentation-registry.mjs';

const registry = loadHeroPresentations();
// Runtime tests keep their scheduler/loader fakes while using the real shared
// registration owners. Each test can still override its outer viewport/depth.
export function installHeroPresentation(context) {
  Object.assign(context, {
    BATTLE_HERO_BODY_HEIGHT,
    battlePaintCharacter(ctx, unit, key, clip, image, frame) {
      return paintHeroSprite(ctx, image, clip, frame, heroPresentationFor(registry, unit), key);
    },
    battleCharacterBody(unit) {
      return projectHeroBody(heroPresentationFor(registry, unit), unit,
        context.battleCharacterScale(unit) * context.battleCharacterDepthScale(unit));
    }
  });
  return context;
}
