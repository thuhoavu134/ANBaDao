import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EQUIPMENT_ASSET_REGISTRY,
  EQUIPMENT_ASSET_SCHEMA,
  EQUIPMENT_ASSET_VERSION,
  FORGE_MATERIAL_ASSETS,
  validateEquipmentAssetRegistry
} from '../src/domain/equipment/item-assets.mjs';

const root = process.cwd();
const out = join(root, 'dist');
const check = validateEquipmentAssetRegistry();
if (!check.ok) throw new Error(`Equipment asset registry invalid: ${check.errors.join(', ')}`);

const registryJson = JSON.stringify(EQUIPMENT_ASSET_REGISTRY);
const materialsJson = JSON.stringify(FORGE_MATERIAL_ASSETS);
const schemaJson = JSON.stringify(EQUIPMENT_ASSET_SCHEMA);
const versionJson = JSON.stringify(EQUIPMENT_ASSET_VERSION);
const runtime = `<script id="forge-item-assets-v1">
(()=>{
  const registry=${registryJson};
  const materials=${materialsJson};
  globalThis.HON_VIET_EQUIPMENT_ASSET_SCHEMA=${schemaJson};
  globalThis.HON_VIET_EQUIPMENT_ASSET_VERSION=${versionJson};
  globalThis.HON_VIET_EQUIPMENT_ASSET_REGISTRY=registry;
  globalThis.HON_VIET_FORGE_MATERIAL_ASSETS=materials;
  globalThis.honVietEquipmentAssetFor=(itemOrSlot,rarity)=>{
    const slot=typeof itemOrSlot==='string'?itemOrSlot:itemOrSlot?.slot;
    const rar=typeof itemOrSlot==='string'?rarity:itemOrSlot?.rar;
    return registry[String(slot||'')]?.[String(rar||'').toLowerCase()]?.path||null;
  };
  globalThis.honVietForgeMaterialAssetFor=id=>materials[String(id||'')]?.path||null;
})();
</script>
`;
const css = readFileSync(join(root, 'src/ui/forge-item-assets.css'), 'utf8');
const uiRuntime = readFileSync(join(root, 'src/ui/forge-item-assets-runtime.js'), 'utf8');
new Function(uiRuntime);

const path = join(out, 'index.html');
let html = readFileSync(path, 'utf8');
if (html.includes('id="forge-item-assets-v1"')) throw new Error('Forge item asset runtime already installed');
const renderStart = html.indexOf('function renderForge(){');
const renderEnd = html.indexOf('/* ===================== BỘ BẢO VẬT', renderStart);
if (renderStart < 0 || renderEnd < renderStart) throw new Error('Forge render boundary missing');
html = html.slice(0, renderStart) + uiRuntime + '\n' + html.slice(renderEnd);
html = html.replace('</head>', `<style id="forge-item-assets-css">${css}</style>\n${runtime}</head>`);
writeFileSync(path, html);
console.log(`Forge item assets installed: ${Object.keys(EQUIPMENT_ASSET_REGISTRY).length} slots, ${Object.values(EQUIPMENT_ASSET_REGISTRY).reduce((n, slot) => n + Object.keys(slot).length, 0)} equipment icons, ${Object.keys(FORGE_MATERIAL_ASSETS).length} material icons`);
