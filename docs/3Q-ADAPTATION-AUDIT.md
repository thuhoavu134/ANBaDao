# 3Q → Hồn Việt adaptation audit

Updated: 2026-09-03

## Scope

The supplied Google Drive archive was downloaded and extracted locally as `3Q.rar`.
It is a valid RAR v4 archive (2,360,533,878 bytes); `unrar t` passed and the
extraction completed with 23,712 entries / about 4.7 GB. The audit only uses the
archive to identify reusable combat-domain patterns. It does not copy 3Q branding,
art, deployment credentials, payment code, server configuration, or client bundles.

## Reusable domain patterns

| 3Q component | Observed responsibility | Hồn Việt adaptation |
| --- | --- | --- |
| `PlayCtx` + `PlayPO` | Own one battle, round limit, outcome, and replay aggregate | `createSession`, `finishBattle`, `streamlineReplay` |
| `RoundCtx` | Delimit a numbered round and its lifecycle | `beginRound`, `finishRound` |
| `MoveCtx` + `ActionCtx` | Group one actor's move and its action settlement | `beginMove`, `recordAction`, `finishMove` |
| `ActionResult` / typed result samples | Emit inspectable damage, heal, buff, death, and resurrection results | `COMBAT_RESULT_TYPES`, `deriveResults`, `recordResult` |
| `Fighter` composition | Keep attributes, buffs, skills, cooldowns, and round variables separate | `normalizeFighter`, `resetFighter`, `canAct` |
| `FighterCD` | Store ready-round records and cooldown rewrites | cooldown helpers in the adapter |
| `SkillTargetSelector` | Deterministic position/priority target selection | `selectTargets` (`front`, `back`, `lowestHp`, `highestAtk`, `random`) |

## Integration boundary

`scripts/combat-domain-3q-adapter-v1.mjs` is a build-time, idempotent patch. It
injects the small domain factory into `dist/battle.html` and wraps the existing
`resolveAction` function. The wrapper snapshots the existing units before and
after settlement, derives typed results, and exposes the latest compact replay at
`window.__HV_COMBAT_LAST_REPLAY`.

The existing Hồn Việt damage formulas, action timing, round clock, visual effects,
background registry, and result UI remain the source of truth. No global scheduler
or second combat loop is introduced.

## Deliberately not copied

- Compiled Java/Spring server JARs: incompatible runtime and not needed by the
  static Hồn Việt build.
- Minified Laya client bundle: renderer/data transport, not a maintainable source
  module.
- PHP admin/API, socket service, payment, and deployment files: operational or
  security-sensitive concerns outside the game-domain adapter.
- 3Q images, audio, names, and UI: Hồn Việt keeps its own Vietnamese identity and
  asset licensing boundary.

## Verification

The adapter has focused Node tests for fighter lifecycle, round/move/action result
IDs, deterministic target selection, cooldown readiness, replay serialization, and
browser-factory execution. It is wired into the static build after the existing
runtime patches and is safe to run more than once.
