// Validate the AI's proposal against the same rules used at action entry.
// Keep kit-specific targets; fallback basics still use the formation owner.
export function resolveBattleAiIntent(actor, intent, { canUse, targets, preferred }) {
  const validate = (action, target) => {
    if (!canUse(actor, action)) return null;
    const legal = targets(actor, action).filter(unit => unit && unit.hp > 0);
    const chosen = legal.find(unit => unit.id === target?.id)
      || legal.find(unit => unit.id === preferred(actor, action)?.id) || legal[0];
    return chosen ? { action, target: chosen } : null;
  };
  const proposed = intent && validate(intent.action, intent.target);
  if (proposed) return proposed;
  for (const action of ['basic', 'skill', 'ultimate']) {
    const fallback = validate(action);
    if (fallback) return fallback;
  }
  return null;
}
