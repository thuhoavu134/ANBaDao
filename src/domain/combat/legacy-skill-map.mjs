// Shared owner for host bridge and campaign tooling. Preserve legacy mapping.
export function mapLegacyCombatSkill(combatant) {
    const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
    const safeText=(value,fallback="")=>String(value==null?fallback:value);
    const skill = combatant.skill || {};
    const fx = skill.fx || {};
    const target = fx.target || "enemy";
    const effectKind = fx.kind || "damage";
    const power = Number(fx.power || 1.15);
    let kind = "burn";

    if (effectKind === "heal") kind = target === "aoe_ally" ? "healAll" : "heal";
    else if (["shield", "buff", "haste"].includes(effectKind)) kind = target === "aoe_ally" ? "guardAll" : "guard";
    else if (effectKind === "revive") kind = "healAll";
    else if (effectKind === "multi") kind = "double";
    else if (target === "aoe_enemy" || target === "all" || effectKind === "fear") kind = (fx.then || effectKind === "fear") ? "aoeBurn" : "aoe";
    else if (["mark", "debuff", "strip"].includes(effectKind) || ["mark", "debuff", "strip"].includes(fx.then?.kind)) kind = "break";
    else if (fx.missingHpBonus || power >= 2.25) kind = "execute";
    else if (fx.splash) kind = "aoe";

    const ultimate = combatant.ultimate || {};
    const ultimateFx = ultimate.fx || {};
    const ultimateTarget = ultimateFx.target || "";
    const ultimateEffect = ultimateFx.kind || "";
    let ultimateKind = kind;
    if (ultimateEffect === "heal") ultimateKind = ultimateTarget === "aoe_ally" ? "healAll" : "heal";
    else if (["shield", "buff", "haste"].includes(ultimateEffect)) ultimateKind = "guardAll";
    else if (ultimateEffect === "multi") ultimateKind = "multi";
    else if (ultimateTarget === "aoe_enemy" || ultimateTarget === "all") ultimateKind = ultimateFx.then ? "aoeDebuff" : "aoe";
    else if (["mark", "debuff", "strip"].includes(ultimateEffect) || ["mark", "debuff", "strip"].includes(ultimateFx.then?.kind)) ultimateKind = "break";
    else if (ultimateFx.missingHpBonus || Number(ultimateFx.power) >= 2.25) ultimateKind = "execute";
    else if (!ultimate.name) {
      if (kind === "heal") ultimateKind = "healAll";
      else if (kind === "guard") ultimateKind = "guardAll";
      else if (kind === "aoe") ultimateKind = "aoeBurn";
      else if (["double", "break", "burn"].includes(kind)) ultimateKind = "execute";
    }

    const skillMultiplier = clamp(0.72 + power * 0.33, 0.82, 1.72);
    const ultimatePower = Number(ultimateFx.power || power);
    const ultimateMultiplier = clamp(1.12 + ultimatePower * 0.42, 1.32, 2.55);
    const name = skill.name || (combatant.side === "ally" ? "Chiến Kỹ Hồn Việt" : "Tà Kích");
    const detail = safeText(skill.desc, "Kỹ năng riêng").replace(/\s+/g, " ").slice(0, 54);
    return {
      skillName: name,
      skillDetail: `${detail} • 25 khí`,
      skillKind: kind,
      skillMultiplier,
      ultimateName: ultimate.name || `Tà Lực · ${name}`,
      ultimateDetail: `${safeText(ultimate.desc, "Bản cường hóa").replace(/\s+/g, " ").slice(0, 54)} • 60 khí`,
      ultimateKind,
      ultimateMultiplier
    };
  }
