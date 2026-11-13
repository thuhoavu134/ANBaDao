import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');
const moduleSource = readFileSync(
  join(process.cwd(), 'src/domain/save/save-contract.mjs'),
  'utf8'
).replace(/^export\s+/gm, '');

new Function(moduleSource);

const saveMarker = 'const SAVE_KEY="mong_gioi_save_v1";';
if (!html.includes(saveMarker)) throw new Error('Save key marker not found');
html = html.replace(saveMarker, moduleSource + '\n' + saveMarker);

const defaultMarker = 'return { v:1, codes:';
if (!html.includes(defaultMarker)) throw new Error('Default player marker not found');
html = html.replace(
  defaultMarker,
  'return { v:1, schemaVersion:SAVE_SCHEMA_VERSION, revision:0, codes:'
);

const migrationMarker = 'function migrateSave(p){';
if (!html.includes(migrationMarker)) throw new Error('Migration marker not found');
html = html.replace(
  migrationMarker,
  `function migrateSave(p){
  const saveValidation = validateSaveObject(p);
  if (!saveValidation.ok) return buildRecoveryPlayer(saveValidation);
  p = migrateSaveObject(p);`
);

const loadStart = html.indexOf('function loadSave(){');
const loadEnd = html.indexOf('\n', loadStart);
if (loadStart < 0 || loadEnd < 0) throw new Error('Load function marker not found');
const oldLoad = html.slice(loadStart, loadEnd);
const newLoad = `function loadSave(){
  try {
    const raw = SAFE_LS.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = parseSavePayload(raw);
    if (!parsed.ok) {
      const backupRaw = SAFE_LS.getItem(SAVE_BACKUP_STORAGE_KEY);
      const backup = backupRaw ? parseSavePayload(backupRaw) : null;
      if (backup?.ok && backup.value) {
        const reason = { code: 'RECOVERED_FROM_BACKUP', source: parsed.code };
        try { window.__mgSaveRecovery = reason; } catch(e) {}
        return migrateSave(markSaveRecovery(backup.value, reason));
      }
      MEMORY_ONLY = true;
      try { window.__mgSaveRecovery = parsed; } catch(e) {}
      return buildRecoveryPlayer(parsed);
    }
    try { delete window.__mgSaveRecovery; } catch(e) {}
    return migrateSave(parsed.value);
  } catch(error) {
    const reason = { ok: false, code: 'SAVE_READ_FAILED', message: 'Không đọc được bản lưu.' };
    MEMORY_ONLY = true;
    try { window.__mgSaveRecovery = reason; } catch(e) {}
    return buildRecoveryPlayer(reason);
  }
}`;
html = html.replace(oldLoad, newLoad);

const persistStart = html.indexOf('function persist(){');
const persistEnd = html.indexOf('\n', persistStart);
if (persistStart < 0 || persistEnd < 0) throw new Error('Persist function marker not found');
const oldPersist = html.slice(persistStart, persistEnd);
const newPersist = `function persist(){
  if(P) P.squad=normalizeSquad(P.squad,P,false);
  if(isSaveRecovery(P)){
    MEMORY_ONLY = true;
    try { window.__mgSaveRecovery = P.__saveRecovery; } catch(e) {}
    netScheduleSync();
    return false;
  }
  try {
    const previous = SAFE_LS.getItem(SAVE_KEY);
    if(previous){
      try { SAFE_LS.setItem(SAVE_BACKUP_STORAGE_KEY, previous); }
      catch(error){ try { window.__mgSaveBackupError = error?.message || 'BACKUP_WRITE_FAILED'; } catch(e) {} }
    }
    P = prepareSaveState(P, { previousRevision: P?.revision, now: Date.now() });
    const serialized = JSON.stringify(P);
    SAFE_LS.setItem(SAVE_KEY, serialized);
    if(SAFE_LS.getItem(SAVE_KEY) !== serialized) throw new Error('SAVE_VERIFY_FAILED');
    MEMORY_ONLY = false;
    try { delete window.__mgSaveError; } catch(e) {}
  } catch(error) {
    MEMORY_ONLY = true;
    try { window.__mgSaveError = error?.message || 'SAVE_WRITE_FAILED'; } catch(e) {}
  }
  netScheduleSync();
  return !MEMORY_ONLY;
}`;
html = html.replace(oldPersist, newPersist);

const importGuard = "  if(!p||p.v!==1||typeof p.heroes!=='object'||!p.heroes) return {ok:false,msg:'Chuỗi không phải bản lưu Giang Hồ.'};";
if (!html.includes(importGuard)) throw new Error('Import validation marker not found');
html = html.replace(
  importGuard,
  "  const saveValidation = validateSaveObject(p);\n  if(!saveValidation.ok) return {ok:false,msg:saveValidation.message};"
);

writeFileSync(p, html);
console.log('Save contract v1 installed: versioned state, revision, backup and recovery guards');
