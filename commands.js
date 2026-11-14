
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const DEFAULT_GROUPS_FILE = path.join(ROOT, 'data', 'groups.json');
if (!fs.existsSync(GROUPS_FILE) && fs.existsSync(DEFAULT_GROUPS_FILE)) {
  fs.copyFileSync(DEFAULT_GROUPS_FILE, GROUPS_FILE);
}
const SETTINGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'settings.json'), 'utf8'));
const MEDIA_DIR = path.join(ROOT, 'media');

function readGroups() {
  try {
    const parsed = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Não foi possível ler data/groups.json:', error.message);
    return [];
  }
}
let groups = readGroups();

function saveGroups() {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
}
function getGroupConfig(jid) {
  let config = groups.find(g => g.groupId === jid);
  if (!config) {
    config = {
      name: '', groupId: jid, prefixos: [SETTINGS.defaultPrefix || '.'],
      antilinkgp: false, wellcome: [{ bemvindo1: false, legendabv: 'Olá #numerodele#, seja bem-vindo(a) ao grupo #nomedogp#' }],
      listanegra: [], advertir: []
    };
    groups.push(config);
    saveGroups();
  }
  if (!Array.isArray(config.prefixos) || !config.prefixos.length) config.prefixos = [SETTINGS.defaultPrefix || '.'];
  if (!Array.isArray(config.wellcome)) config.wellcome = [{ bemvindo1: false }];
  return config;
}
function getText(message) {
  const m = message.message || {};
  return m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId || '';
}
function senderOf(msg) {
  return msg.key.participant || msg.key.remoteJid;
}
function getMentioned(msg) {
  const m = msg.message || {};
  const context = m.extendedTextMessage?.contextInfo ||
    m.imageMessage?.contextInfo || m.videoMessage?.contextInfo || {};
  return context.mentionedJid || [];
}
function getQuotedParticipant(msg) {
  const m = msg.message || {};
  const context = m.extendedTextMessage?.contextInfo ||
    m.imageMessage?.contextInfo || m.videoMessage?.contextInfo || {};
  return context.participant || null;
}
function isAdmin(metadata, jid) {
  const p = metadata.participants.find(x => x.id === jid || x.jid === jid);
  return Boolean(p && (p.admin === 'admin' || p.admin === 'superadmin'));
}
function normalizePrefix(text, prefixes) {
  return prefixes.find(prefix => text.startsWith(prefix));
}
function menu(prefix) {
  return `╭━━〔 ✦ NOVA ERA 2.0 ✦ 〕━━╮
┃
┃ ${prefix}menu
┃ ${prefix}abrir
┃ ${prefix}fechar
┃ ${prefix}ban @pessoa
┃ ${prefix}promover @pessoa
┃ ${prefix}rebaixar @pessoa
┃ ${prefix}antilink on/off
┃ ${prefix}boasvindas on/off
┃ ${prefix}figurinha (responda uma imagem)
┃ ${prefix}audios
┃ ${prefix}audio nome
┃ ${prefix}status
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
Comandos administrativos exigem que você seja admin.
O bot também precisa ser admin para alterar participantes ou configurações.`;
}
async function reply(sock, jid, text, quoted) {
  return sock.sendMessage(jid, { text }, quoted ? { quoted } : {});
}
async function getMetadata(sock, jid) {
  return sock.groupMetadata(jid);
}
function getTarget(msg) {
  return getMentioned(msg)[0] || getQuotedParticipant(msg);
}
function listAudioNames() {
  return Object.keys(SETTINGS.audioAliases || {}).sort();
}

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast' || msg.key.fromMe || !msg.message) return;
  const isGroup = jid.endsWith('@g.us');
  if (!isGroup) return; // Este pacote foi configurado como bot de gerenciamento de grupos.
  const sender = senderOf(msg);
  const text = getText(msg).trim();
  if (!text) return;

  const config = getGroupConfig(jid);
  const prefixes = config.prefixos;
  const prefix = normalizePrefix(text, prefixes);

  // Moderação antilink: não interfere em administradores.
  if (config.antilinkgp && /(https?:\/\/|www\.|chat\.whatsapp\.com\/)/i.test(text) && !prefix) {
    try {
      const metadata = await getMetadata(sock, jid);
      if (!isAdmin(metadata, sender)) {
        await sock.sendMessage(jid, { delete: msg.key });
        await reply(sock, jid, '⚠️ Links não são permitidos neste grupo.');
      }
    } catch (error) {
      console.error('Falha no antilink:', error.message);
    }
    return;
  }
  if (!prefix) return;

  const rest = text.slice(prefix.length).trim();
  if (!rest) return;
  const [rawCommand, ...args] = rest.split(/\s+/);
  const command = rawCommand.toLowerCase();
  const arg = args.join(' ').toLowerCase();

  if (command === 'menu' || command === 'help' || command === 'ajuda') {
    return reply(sock, jid, menu(prefix), msg);
  }
  if (command === 'status') {
    return reply(sock, jid, `✦ Nova Era 2.0 online\nGrupo: ${config.name || jid}\nPrefixo: ${prefix}\nAntilink: ${config.antilinkgp ? 'ligado' : 'desligado'}\nBoas-vindas: ${config.wellcome?.[0]?.bemvindo1 ? 'ligadas' : 'desligadas'}`, msg);
  }
  if (command === 'audios') {
    return reply(sock, jid, `🎧 Áudios disponíveis:\n${listAudioNames().map(x => `• ${prefix}audio ${x}`).join('\n')}`, msg);
  }
  if (command === 'audio') {
    const file = SETTINGS.audioAliases?.[args[0]?.toLowerCase()];
    if (!file) return reply(sock, jid, `Áudio não encontrado. Use ${prefix}audios.`, msg);
    const full = path.join(MEDIA_DIR, file);
    if (!fs.existsSync(full)) return reply(sock, jid, 'Arquivo de áudio não está disponível.', msg);
    return sock.sendMessage(jid, { audio: fs.readFileSync(full), mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
  }
  if (command === 'figurinha' || command === 's' || command === 'sticker') {
    try {
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasMedia = msg.message?.imageMessage || msg.message?.videoMessage || quotedMessage?.imageMessage || quotedMessage?.videoMessage;
      if (!hasMedia) return reply(sock, jid, `Envie ou responda uma imagem/vídeo com ${prefix}figurinha.`, msg);
      const source = quotedMessage ? { ...msg, message: quotedMessage, key: { ...msg.key, id: msg.message.extendedTextMessage.contextInfo.stanzaId, participant: msg.message.extendedTextMessage.contextInfo.participant } } : msg;
      const buffer = await downloadMediaMessage(source, 'buffer', {});
      const sticker = new Sticker(buffer, { pack: 'Nova Era', author: 'Nova Era 2.0', type: StickerTypes.FULL, quality: 70 });
      return sock.sendMessage(jid, await sticker.toMessage(), { quoted: msg });
    } catch (error) {
      console.error('Erro ao criar figurinha:', error);
      return reply(sock, jid, 'Não consegui converter essa mídia. Tente uma imagem ou vídeo curto.', msg);
    }
  }

  const adminCommands = ['abrir','fechar','ban','promover','rebaixar','antilink','boasvindas'];
  if (!adminCommands.includes(command)) return;
  let metadata;
  try { metadata = await getMetadata(sock, jid); }
  catch { return reply(sock, jid, 'Não consegui consultar os administradores deste grupo.', msg); }
  if (!isAdmin(metadata, sender)) return reply(sock, jid, '⛔ Somente administradores do grupo podem usar este comando.', msg);
  const botJid = sock.user?.id?.replace(/:\d+@/, '@');
  if (!isAdmin(metadata, botJid)) return reply(sock, jid, '⚠️ Primeiro torne o bot administrador do grupo.', msg);

  if (command === 'fechar' || command === 'abrir') {
    try {
      await sock.groupSettingUpdate(jid, command === 'fechar' ? 'announcement' : 'not_announcement');
      return reply(sock, jid, command === 'fechar' ? '🔒 Grupo fechado: somente administradores podem enviar mensagens.' : '🔓 Grupo aberto: todos podem enviar mensagens.', msg);
    } catch (error) {
      return reply(sock, jid, `Não consegui alterar o grupo: ${error.message}`, msg);
    }
  }
  if (command === 'antilink') {
    if (!['on','off','ligar','desligar'].includes(arg)) return reply(sock, jid, `Use ${prefix}antilink on ou ${prefix}antilink off.`, msg);
    config.antilinkgp = ['on','ligar'].includes(arg);
    saveGroups();
    return reply(sock, jid, `Antilink ${config.antilinkgp ? 'ativado' : 'desativado'}.`, msg);
  }
  if (command === 'boasvindas') {
    if (!['on','off','ligar','desligar'].includes(arg)) return reply(sock, jid, `Use ${prefix}boasvindas on ou ${prefix}boasvindas off.`, msg);
    config.wellcome[0] ||= {};
    config.wellcome[0].bemvindo1 = ['on','ligar'].includes(arg);
    saveGroups();
    return reply(sock, jid, `Boas-vindas ${config.wellcome[0].bemvindo1 ? 'ativadas' : 'desativadas'}.`, msg);
  }
  if (['ban','promover','rebaixar'].includes(command)) {
    const target = getTarget(msg);
    if (!target) return reply(sock, jid, `Marque a pessoa ou responda uma mensagem com ${prefix}${command}.`, msg);
    if (target === botJid) return reply(sock, jid, 'Não posso executar essa ação contra mim mesmo.', msg);
    try {
      const action = command === 'ban' ? 'remove' : command === 'promover' ? 'promote' : 'demote';
      await sock.groupParticipantsUpdate(jid, [target], action);
      return reply(sock, jid, command === 'ban' ? 'Participante removido.' : command === 'promover' ? 'Participante promovido a administrador.' : 'Administrador rebaixado.', msg);
    } catch (error) {
      return reply(sock, jid, `Não consegui concluir a ação: ${error.message}`, msg);
    }
  }
}

export async function handleParticipantsUpdate(sock, update) {
  if (update.action !== 'add') return;
  const config = getGroupConfig(update.id);
  if (!config.wellcome?.[0]?.bemvindo1) return;
  try {
    const metadata = await sock.groupMetadata(update.id);
    for (const participant of update.participants) {
      const number = participant.split('@')[0];
      const template = config.wellcome[0].legendabv || 'Olá #numerodele#, seja bem-vindo(a) ao grupo #nomedogp#';
      const message = template.replace(/#numerodele#/g, `@${number}`).replace(/#nomedogp#/g, metadata.subject);
      await sock.sendMessage(update.id, { text: message, mentions: [participant] });
    }
  } catch (error) {
    console.error('Falha nas boas-vindas:', error.message);
  }
}
