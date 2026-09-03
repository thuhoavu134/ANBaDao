# Hồn Việt — Function map và kế hoạch áp dụng 3Q

Ngày audit: 2026-09-03  
Phạm vi: source mới nhất trên nhánh main của bktimmy247/luc-than và archive 3Q.rar đã giải nén/audit.  
Trạng thái: tài liệu kiến trúc; commit này không thay đổi math, UI, asset hay flow battle hiện tại.

## Checkpoint triển khai 2026-09-03

- Đã thêm src/domain/combat/battle-session.mjs, round-manager.mjs, combat-result.mjs và barrel index.mjs.
- Đã thêm contract tests cho module; test 3Q core cũ + module mới đạt 10/10 PASS.
- Build adapter có safety gate kiểm tra schema, round/move ID và typed result trước khi nhúng iframe.
- battle.html đã gửi replay versioned qua BattleResultPayload; nếu replay không parse được thì payload nhận null thay vì làm hỏng trận.
- Smoke patch chạy hai lần liên tiếp không nhân đôi wrapper; compile in-memory của battle.html sau patch không có lỗi.
- Các module thuần chưa thay thế factory browser-embedded trong combat-domain-3q-core.mjs; giữ nguyên như vậy để không làm vỡ đường chạy direct/browser. Đây là ranh giới migration có chủ ý, không coi là đã hoàn tất wiring.

## 1. Quyết định kiến trúc

1. Giữ nguyên build đang chạy và tiến hóa từng lát cắt. Không rewrite toàn bộ index.html hoặc battle.html.
2. Ranh giới module đặt theo invariant và ownership của state, không đặt theo số lượng nút UI. Một nút chỉ phát một command; module domain mới là nơi kiểm tra luật và phát event.
3. 3Q được dùng làm chuẩn tham chiếu cho battle domain: session, team, fighter, round, action, result, target, status, cooldown và replay. Không bê nguyên Java/Laya/PHP/payment/socket/deploy/config/asset.
4. Chỉ bê nguyên code khi có quyền sử dụng rõ ràng và code tương thích; hiện các commit 3Q trước đây chỉ reimplement behavior/contract thuần, không sao chép artifact biên dịch.
5. Không đưa đồng hồ combat toàn cục trở lại. Thời gian chỉ là telemetry hoặc animation scheduling; thứ tự gameplay phải do round/queue/action quyết định.
6. Không dùng hub background làm battle background. Battle vẫn chờ bitmap 16:9 sạch theo chapter; visual patch hiện tại trỏ nhầm hub và được đánh dấu FAIL trong handoff.

## 2. Runtime hiện tại đã xác nhận

### 2.1 Hai HTML lớn đang cùng chứa logic

| Khối | Vai trò thực tế | Rủi ro |
|---|---|---|
| index.html | Shell của game: DATA, save player P, UI/state ST, economy, social, campaign và một legacy battle engine | 510 function declarations; nhiều ownership bị trộn, dễ sửa nhầm |
| battle.html | Runtime battle hiện đại trong iframe, có HonVietCore, queue/round/action, objective, tactical state, result và VFX | hơn 500 function declarations; domain và presentation vẫn nằm chung file |

index.html vẫn có các function legacy như runBattle, nextTurn, tickStatuses, resolveAction, applyEffect, checkKO và endTurn. Tuy nhiên ở cuối file, startFight được gán lại cho openIntegratedBattle. Vì vậy đường đi bình thường hiện là:

Hub/Campaign → runBattle → startFight (alias mới) → openIntegratedBattle → battle.html iframe → postMessage kết quả → finishIntegratedBattle → cập nhật P/ST/campaign/report.

Kết luận: legacy engine chưa được xóa vì còn là nguồn đối chiếu/parity, nhưng không được mở rộng thêm. Chỉ retire sau khi có test chứng minh mọi entry point đã đi qua battle gateway mới.

### 2.2 State cần tách ownership

| State hiện tại | Ownership nên chốt |
|---|---|
| DATA | content/config read-only; tách dần thành catalog theo domain |
| P | persistence aggregate; chỉ application commands được phép mutate |
| ST | navigation/campaign shell state |
| S | battle bridge/session mirror ở parent; không phải nguồn sự thật của iframe |
| battle.html state | BattleSession thực tế; renderer chỉ đọc snapshot/event |

## 3. Bản đồ chức năng Hồn Việt → module

| Chức năng người chơi | Entry point/state hiện tại | Module đích | Mức đối chiếu 3Q | Việc nên làm |
|---|---|---|---|---|
| Hub, tab, back, unlock | render screen, ST.screen, các handler nút | NavigationState, UnlockGuard, ScreenRouter | Không có tương đương trực tiếp | Tách query/command, giữ HTML shell |
| Campaign/journey/chapter | chapterIdx, sceneId, runBattle, campaign result | CampaignState, MissionSequence, EncounterGateway, CampaignResult | PlayCtx lifecycle và winner | Chuẩn hóa encounter input/output |
| Team/formation | ST.squad, P.squad, team screen | SquadState, FormationRules, SaveSquadCommand | TeamVS/FightTeam | Chốt slot/team/hero ID, không cho UI sửa trực tiếp |
| Mở trận/iframe | openIntegratedBattle, serialize config, postMessage | BattleSessionGateway, BattlePayloadCodec, BattleResultBridge | PlayCtx/PlayPO | Giữ iframe; validate schema và sessionId |
| Battle session | battleId, mode, round, queue, objective | BattleSession, RoundManager, BattleOutcome | PlayCtx/PlayPO | Đưa lifecycle vào core thuần |
| Đội và fighter | units, team, hero fields, alive/KO | BattleTeams, FighterState | TeamVS/FightTeam/Fighter | Chuẩn hóa snapshot bất biến ở boundary |
| Skill/action | resolveAction, performAction, advanceTurn | ActionPipeline, ActionContext, MoveContext | MoveCtx/ActionCtx | Tách intent → resolve → result; không đổi công thức hiện tại |
| Damage/heal/dead/status result | apply damage/heal, checkBattleEnd, VFX | CombatResult, ResultReducer, BattleOutcome | ActionResult/ResultSample | Mọi mutation phải tạo typed result |
| Target selection | reactionTargetsFor và logic chọn target | TargetSelector | SkillTargetSelector | Deterministic theo seed/slot; test front/back/lowest/highest |
| Buff/debuff/status | status fields, tick/expire hooks | StatusSystem, StatusHooks | FighterBuffs | Hook dispatch rõ, không để renderer tự hết hạn status |
| Skill cooldown | skill cooldown fields/round checks | CooldownSystem | FighterCD | Quy ước readyRound nhất quán, test off-by-one |
| Round variable/tactical | momentum, adaptive AI, flags, actionBreakdown | RoundContext, TacticalState | FighterRoundVar + MoveCtx flags | Reset theo round/session, không dùng clock toàn cục |
| Replay/report | actionBreakdown, publishBattleResult, battleReports | ReplayRecorder, BattleReport | PlayPO + FightTask lifecycle | Ghi event tối thiểu, serialize versioned |
| Hero roster/detail/skill/costume | heroes screen, heroBuilds, mastery | HeroCatalog, HeroProfile, Progression, SkillCatalog | Fighter/FighterSkills ở mức data contract | Tách read model khỏi battle snapshot |
| Inventory/equip/forge/summon/shop | P.inventory, equip, bag/shop/forge handlers | Inventory, Equipment, Forge, Summon, Shop | Không lấy từ 3Q battle JAR | Domain riêng; chống double-spend bằng command |
| Mail/chat/friend/guild/family | P.mail/social/guild và screen handlers | SocialState, Mailbox, Guild | Không lấy từ 3Q combat | Chưa trộn vào combat |
| BGM/audio/result VFX | BgmRouter, result-audio/runtime patches, renderer | AudioAdapter, CombatPresentation | Không lấy từ 3Q domain | Event-driven; không để audio quyết định luật |
| Save/load/telemetry | local persistence, reports, bridge mirror | SaveStorageAdapter, TelemetryAdapter | FightTask finished/invalid gợi ý lifecycle | Version save và migrate riêng |

## 4. Mapping lớp 3Q và mức tái sử dụng

| 3Q artifact/behavior đã audit | Hồn Việt tương ứng | Quyết định |
|---|---|---|
| PlayCtx + PlayPO | BattleSession + ReplayRecorder + BattleOutcome | Tái sử dụng lifecycle/contract; viết lại bằng module thuần |
| TeamVS + FightTeam | BattleTeams | Tái sử dụng team lifecycle, hero list, isOver/getWinnerTeam |
| Fighter | FighterState | Tái sử dụng composition attr/buff/skill/cd/roundVar; bỏ dependency runtime Java |
| FighterSkills | SkillState/SkillCatalog | Tái sử dụng phân tách skill source và replace map nếu game cần |
| FighterBuffs | StatusSystem | Tái sử dụng hook add/remove/query/expire/copy |
| FighterCD | CooldownSystem | Tái sử dụng ready-round semantics và offset; khóa test round boundary |
| FighterRoundVar | RoundContext/TacticalState | Tái sử dụng reset/record theo round |
| FightSituation | TargetSelector + BattleQuery | Tái sử dụng helper front/back, min/max HP, job count; seed phải deterministic |
| MoveCtx + ActionCtx | MoveContext + ActionContext | Tái sử dụng flags repeat/chaos/moveAgain/counter; chỉ giữ flag game Hồn Việt có ý nghĩa |
| ActionResult + ResultSample | CombatResult | Tái sử dụng typed result thay vì copy class hierarchy |
| SkillTargetSelector | TargetSelector | Tái sử dụng mode/priority; ánh xạ slot 6v6 Hồn Việt |
| FightTask + FightManager | EncounterTask + BattleSessionGateway | Tái sử dụng started/running/finished/invalid và tốc độ hiển thị; không để speed đổi kết quả |

Các JAR/server package, bundle Laya minified, PHP payment/socket/deploy, cấu hình vận hành và asset của 3Q không phải module để copy. Chúng chỉ là bằng chứng để thiết kế behavior/ownership.

## 5. Contract tối thiểu cần khóa trước khi tách file

| Contract | Trường bắt buộc | Invariant |
|---|---|---|
| BattleSession | sessionId, mode, seed, phase, roundIndex, teams, objective, replayVersion | một session có một nguồn sự thật; kết thúc chỉ một lần |
| FighterSnapshot | id, team, slot, hp, maxHp, stats, statuses, cooldowns | id ổn định; snapshot không chứa DOM node |
| ActionIntent | actorId, skillId/actionKind, targetIds, roundIndex, metadata | actor còn sống và actionable mới được resolve |
| CombatResult | type, sourceId, targetId, amount/statusId, roundIndex, reason | typed, tuần tự, replay được |
| BattleEvent | eventType, sessionId, sequence, payload | sequence tăng đơn điệu; bridge có thể bỏ event trùng |
| BattleResultPayload | sessionId, winner, reason, rounds, actions, units, replay | parent chỉ nhận payload đã validate |

Các result type tối thiểu nên giữ: aim, damage, heal, buff-add, buff-remove, buff-update, resurrect, dead, announce. Đây là contract UI/replay; không đồng nghĩa phải giữ nguyên tên class 3Q.

## 6. Quy tắc “nút UI không phải module”

Luồng đúng cho mọi nút chức năng:

UI click → application command → domain module kiểm tra invariant → event/result → renderer + save/telemetry.

Ví dụ nút “Đánh trận” chỉ gọi StartEncounterCommand. Command tạo payload và sessionId, BattleSessionGateway mở iframe; nút không được tự trừ stamina, tự sửa P.squad hoặc gọi trực tiếp resolveAction. Nút “Nâng cấp” chỉ gọi UpgradeHeroCommand; Progression kiểm tra cost/level rồi phát HeroUpgraded.

Lợi ích là cùng một luật dùng được cho click, replay, test và automation; UI chỉ thay cách trình bày.

## 7. Cấu trúc repo tăng dần, không cần đổi bundler ngay

Giai đoạn đầu có thể dùng ES modules thuần và build-static hiện tại:

src/
  domain/combat/
    battle-session.mjs
    teams.mjs
    fighter.mjs
    round.mjs
    action.mjs
    result.mjs
    status.mjs
    skill.mjs
    cooldown.mjs
    target-selector.mjs
    replay.mjs
  domain/campaign/
    campaign-state.mjs
    mission-sequence.mjs
  domain/roster/
    hero-catalog.mjs
    progression.mjs
  domain/economy/
    inventory.mjs
    equipment.mjs
    forge.mjs
    summon.mjs
    shop.mjs
  application/
    combat-commands.mjs
    campaign-commands.mjs
    roster-commands.mjs
  adapters/
    battle-iframe-gateway.mjs
    save-storage.mjs
    asset-registry.mjs
  ui/
    screen-router.mjs
    battle-result-view.mjs

scripts/ vẫn chỉ làm build/runtime patch idempotent. combat-domain-3q-core.mjs hiện là compatibility/telemetry core; không nên để nó trở thành một monolith mới. Mỗi file domain mới phải có test thuần trước khi nối vào HTML.

## 8. Lộ trình thực hiện

### P0 — khóa contract và safety

- Chuẩn hóa ID/session/round/action/result schema.
- Validate postMessage theo sessionId và payload version.
- Giữ rule không global combat clock.
- Bổ sung test deterministic target, cooldown ready-round, kết thúc một lần và duplicate bridge event.

### P1 — tách combat domain mà không đổi gameplay

- Tách BattleSession, FighterSnapshot, RoundManager, CombatResult và TargetSelector thành module thuần.
- Adapter hiện tại chỉ ghi telemetry/replay; dùng nó làm canary, không thay công thức damage/VFX.
- publishBattleResult có thể thêm replay versioned sau khi test bridge, nhưng không làm parent thành nguồn sự thật.

### P2 — retire legacy battle engine

Chỉ xóa hoặc đóng băng các function battle trong index.html sau khi:

- mọi entry point campaign/journey đều đi qua BattleSessionGateway;
- parity test xác nhận winner, round, action count, rewards và report;
- smoke test iframe chạy được trên iPhone/iPad/desktop;
- không còn caller thực tế của legacy start/turn/effect path.

### P3 — campaign và result bridge

- Tách EncounterGateway, CampaignResult và RewardSettlement.
- Một lần nhận kết quả phải idempotent theo sessionId.
- Chỉ application layer được mutate P/ST; renderer nhận read model.

### P4 — roster và economy

- HeroCatalog/Progression trước; sau đó Inventory/Equipment/Forge/Summon/Shop.
- Mỗi domain có cost validation, transaction key và migration save riêng.
- Không dùng battle fighter object làm hero profile lâu dài.

### P5 — presentation/visual QA

- Sau khi có battle bitmap sạch theo chapter mới xử lý background.
- Damage popup theo handoff: normal 13–16 px world scale, crit 16–19, 5–6 lane dọc, spacing 15–20.
- Audio/BGM/VFX chỉ subscribe event; không tạo state gameplay mới.

## 9. Acceptance checklist cho mỗi module

- Không đọc document/window/localStorage trực tiếp trong domain.
- Input/output serializable và deterministic nếu có seed.
- Không mutate object do caller sở hữu; trả snapshot/result mới.
- Có test cho success, invalid, duplicate và boundary.
- Có adapter riêng nếu cần DOM, iframe, audio hoặc save.
- Build patch chạy idempotent; chạy hai lần không nhân đôi script/wrapper.
- Không làm thay đổi asset/background hoặc global combat timing ngoài yêu cầu đã duyệt.

## 10. Quyết định triển khai kế tiếp

Foundation P0/P1 đầu tiên đã hoàn thành: BattleSession + RoundManager + CombatResult đã có module thuần, test contract, build safety gate và replay versioned ở boundary. Bước code kế tiếp là chạy parity test module ↔ factory browser, sau đó thay từng phần factory bằng bundle được sinh an toàn. Chưa nên đụng economy, social hoặc xóa legacy engine trong cùng một commit. Cách này tiếp tục kiểm chứng logic 3Q từng lát cắt, giữ nguyên visual đang có và có đường rollback rõ ràng.

Commit tài liệu này là mốc kiến trúc; các commit code sau phải tham chiếu function map này và ghi rõ module nào sở hữu state nào.
