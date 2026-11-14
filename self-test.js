
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const groups = JSON.parse(fs.readFileSync(path.join(root, 'data', 'groups.json'), 'utf8'));
const settings = JSON.parse(fs.readFileSync(path.join(root, 'settings.json'), 'utf8'));
const errors = [];
if (!Array.isArray(groups) || groups.length !== 4) errors.push(`Esperados 4 grupos recuperados; encontrados ${groups?.length}`);
for (const [i, group] of groups.entries()) {
  if (!group.groupId?.endsWith('@g.us')) errors.push(`Grupo ${i + 1}: groupId inválido`);
  if (!Array.isArray(group.prefixos) || !group.prefixos.length) errors.push(`Grupo ${i + 1}: prefixos ausentes`);
}
for (const [alias, file] of Object.entries(settings.audioAliases || {})) {
  if (!fs.existsSync(path.join(root, 'media', file))) errors.push(`Áudio ausente (${alias}): ${file}`);
}
for (const file of ['src/index.js', 'src/commands.js']) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo principal ausente: ${file}`);
}
if (errors.length) {
  console.error('Falha na auditoria local:');
  errors.forEach(e => console.error(' -', e));
  process.exit(1);
}
console.log(`Auditoria local OK: ${groups.length} grupos, ${Object.keys(settings.audioAliases || {}).length} áudios e arquivos principais presentes.`);
