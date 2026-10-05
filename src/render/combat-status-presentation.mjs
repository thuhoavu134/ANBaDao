// Reuse shipped semantic HUD artwork. Unique effects without artwork retain text.
export function combatStatusIconType(type){
 const aliases={attackUp:'atkUp',attackDown:'atkDown',armorUp:'defUp',armorDown:'defDown',magicArmorDown:'defDown',shield:'guard',waterShield:'guard',worldSubstitute:'guard',mitigation:'guard',deathWard:'guard',immortal:'guard',controlImmune:'guard',speedDown:'slow',moveSlow:'slow',blind:'accuracyDown',taunted:'taunt',hardSilence:'silence',sleep:'stun',paralysis:'stun',timeFreeze:'stun',entangle:'root',rageSlow:'energyLock',antiHeal:'healDown',resinBleed:'bleed',bloodDebt:'bleed',resinPoison:'poison',viperPoison:'poison',parasite:'poison',brimstone:'burn',thornsDot:'bleed'};
 return aliases[type]||type;
}
