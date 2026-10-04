import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
export function patchMixedCombatHealing(html){
 if(html.includes('/* HV_MIXED_HEAL_OWNER_V1 */'))return html;
 const from='  function __hvApplyHeal3qAdapter(actor, target, multiplier, group = false) {\n    if (!target || target.hp <= 0) return 0;';
 if(html.split(from).length!==2)throw new Error('Mixed healing owner anchor missing');
 return html.replace(from,from+`
    /* HV_MIXED_HEAL_OWNER_V1 */
    const combat=typeof splusCombat==='function'?splusCombat():null;
    if(combat){
      // Core owns legacy cast strength and legacy reductions. S+ owns its
      // received-healing rules, conversion, expiry, cap and heal events.
      const requestTarget={...target,hp:0,statuses:(target.statuses||[]).filter(s=>!(s.splus&&s.type==='healDown'))};
      const requested=Core.calculateHeal(actor,requestTarget,multiplier);
      const amount=combat.heal(actor,target,requested);
      if(actor?.team===TEAM_PLAYER&&amount>0)state.enemyAdaptive.observation.healing+=amount;
      if(amount>0){burst(target.x,target.y,"#73e8bd",group?18:12,"leaf");if(state.sound)window.HonVietSfx?.play("heal");}
      return amount;
    }`);
}
export function installMixedCombatHealing(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchMixedCombatHealing(readFileSync(p,'utf8')));}
