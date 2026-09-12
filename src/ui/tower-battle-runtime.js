(() => {
  if (typeof document === 'undefined' || typeof startTower !== 'function') return;
  if (typeof buildTowerNpcTeam !== 'function') return;
  if (window.HonVietTowerBattle) return;

  function commitTower(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.tower) player.tower = next.tower;
      if (next.gold != null) player.gold = next.gold;
      if (next.gems != null) player.gems = next.gems;
      if (next.shards) player.shards = next.shards;
      return { ok: true };
    };
    if (!run) {
      apply(P);
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source,
      reason: 'tower',
      mutate: apply
    });
  }

  function ssrPool() {
    return typeof poolOf === 'function' ? poolOf('ssr') : [];
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function currentPower() {
    return typeof teamPower === 'function' ? Number(teamPower()) || 0 : 0;
  }

  function currentGate() {
    if (typeof towerPowerGate !== 'function') {
      const power = currentPower();
      return { power, required: power, effective: power, days: 0, pass: true, missing: 0 };
    }
    return towerPowerGate(P, { teamPower: currentPower(), now: Date.now() });
  }

  function rewardLine(clear) {
    const bits = ['+🪙' + clear.goldGain];
    if (clear.gemsGain) bits.push('+💎' + clear.gemsGain);
    if (clear.shardsGain && clear.shardHero) {
      const name = DATA?.heroes?.[clear.shardHero]?.name || clear.shardHero;
      bits.push('+' + clear.shardsGain + ' mảnh ' + name);
    }
    if (clear.trial) {
      bits.push(clear.trialOk
        ? (clear.trial.name + ' +' + clear.trial.sigils + ' Tháp Ấn')
        : (clear.trial.name + ' chưa đạt'));
    }
    return 'Vượt tầng ' + clear.floorCleared + ': ' + bits.join(' · ');
  }

  startTower = function honVietTowerBattleStart() {
    if (typeof refreshStamina === 'function') refreshStamina();
    if (typeof prepareTowerClimb !== 'function') {
      toast?.('Tháp chưa sẵn sàng.');
      return;
    }
    const climb = prepareTowerClimb(P);
    if (!climb.ok) {
      toast?.(climb.message);
      navTo?.('tower');
      return;
    }
    const gate = currentGate();
    if (!gate.pass) {
      toast?.('Lực chiến chưa đủ — vẫn vào trận. Cần ' + fmt(gate.required) + ' · đội ' + fmt(gate.effective) + '.');
    }
    const cost = climb.spentStamina || (typeof TOWER_CLIMB_STAMINA === 'number' ? TOWER_CLIMB_STAMINA : 5);
    if (typeof spendStamina === 'function') {
      if (!spendStamina(cost)) {
        toast?.('Không đủ Độ Tỉnh Táo ⚡');
        return;
      }
    } else {
      P.stamina = climb.stamina;
      persist?.();
    }
    refreshResbar?.();
    const roster = typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' ? OFFICIAL_ROSTER_12_IDS : TOWER_NPC_ROSTER_12;
    const six = buildTowerNpcTeam({
      floor: climb.floor,
      rosterIds: roster,
      heroes: (typeof DATA === 'object' && DATA.heroes) ? DATA.heroes : {}
    });
    if (typeof DATA === 'object') DATA.encounters.__tower = six;
    if (typeof ST === 'object') {
      ST.mode = 'tower';
      ST.towerFloor = climb.floor;
      ST.towerTrial = climb.trial ? climb.trial.id : null;
    }
    runBattle('__tower', win => {
      if (typeof ST === 'object') ST.mode = null;
      if (win) {
        const report = window.__HV_LAST_BATTLE_REPORT || { win: true, playerAlive: 6, playerTotal: 6, round: 8 };
        const clear = prepareTowerClear(P, {
          floor: climb.floor,
          report,
          rng: Math.random.bind(Math),
          ssrPool: ssrPool(),
          now: Date.now(),
          trialId: climb.trial ? climb.trial.id : undefined
        });
        if (clear.ok && commitTower(clear, 'tower.clear:' + clear.floorCleared, 'tower.clear').ok) {
          refreshResbar?.();
          if (clear.floorCleared % 10 === 0) {
            addJournal?.('Đội leo tới tầng ' + clear.floorCleared + ' Tháp Trắng Đêm. Gió trên đó không ngủ.');
            sendMail?.('Tháp Trắng Đêm', 'Tầng ' + clear.floorCleared, 'Gió tầng ' + clear.floorCleared + ' đã ghi tên anh.', { gems: 10 });
            chatSys?.('Tin tháp: đội anh chạm tầng ' + clear.floorCleared + ' Tháp Trắng Đêm!');
          }
          questProgress?.('tower', 1);
          toast?.(rewardLine(clear));
        }
      } else {
        const fail = prepareTowerFail(P, { now: Date.now() });
        if (fail.ok && commitTower(fail, 'tower.fail:' + fail.tower.floor, 'tower.fail').ok) {
          toast?.('Chưa vượt tầng ' + climb.floor + '. Thua không tụt tầng — nghỉ rồi leo tiếp.');
        }
      }
      navTo?.('tower');
    });
  };

  window.HonVietTowerBattle = {
    start: startTower,
    buildTeam: buildTowerNpcTeam
  };
})();
