# L12-R — tap field hero to undock

## Goal

One tap on an occupied Bày trận field hero removes that hero. The player does not need the bench portrait.

## Acceptance

| ID | Criterion |
|---|---|
| L12-R1 | Occupied field tap undocks that hero and leaves a hole; others keep slots. |
| L12-R2 | Empty field tap still selects the hole for a reserve. |
| L12-R3 | `suppressSlotClick` leftover after a drag does not undock or select. |

## Non-goals

Visual redesign, bench-to-field drag, AFK, combat, crop, balance, restoring `74b3976`.
