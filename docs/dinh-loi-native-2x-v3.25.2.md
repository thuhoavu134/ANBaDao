# Đình Lôi Native 2× Runtime v3.25.2

All 14 Đình Lôi runtime atlases now use the full supplied GIF frame resolution rather than enlarging the earlier 1× atlas.

- Landscape frame: 480×270; atlas: 3840×2160.
- Portrait VFX frame: 270×480; atlas: 2160×3840.
- Frame count and timing remain 64 frames / 4 seconds.
- Adaptive alpha cleanup and separate Character/VFX layers remain unchanged.
- The runtime still divides every atlas into an 8×8 grid, so combat layout and action timing do not change.
- The 4× pipeline must always start again from the original GIF frames, never from these 2× atlases.

Rollback source: v3.25.1 package retains the approved 1× atlases.
