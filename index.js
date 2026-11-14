
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleMessage, handleParticipantsUpdate } from './commands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const AUTH_DIR = path.join(DATA_DIR, 'auth');
fs.mkdirSync(AUTH_DIR, { recursive: true });

let starting = false;
let reconnectTimer;

async function startBot() {
  if (starting) return;
  starting = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Nova Era 2.0', 'Chrome', '120.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log('\n📲 Escaneie o QR Code em WhatsApp > Aparelhos conectados:\n');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'open') {
        console.log(`\n✅ ${sock.user?.name || 'Nova Era'} conectado com sucesso.`);
        console.log('O bot está pronto para receber comandos nos grupos.');
      }
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        console.log('Conexão encerrada.', loggedOut ? 'Sessão desconectada; apague data/auth para parear novamente.' : 'Tentando reconectar...');
        if (!loggedOut) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            starting = false;
            startBot().catch(err => console.error('Falha ao reconectar:', err));
          }, 3000);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages) {
        try {
          await handleMessage(sock, message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      }
    });

    sock.ev.on('group-participants.update', async update => {
      try { await handleParticipantsUpdate(sock, update); }
      catch (error) { console.error('Erro no evento de participantes:', error); }
    });
  } catch (error) {
    starting = false;
    console.error('Não foi possível iniciar o bot:', error);
    throw error;
  }
}

process.on('uncaughtException', error => console.error('Erro inesperado:', error));
process.on('unhandledRejection', error => console.error('Promessa rejeitada:', error));
function shutdown(signal) {
  console.log(`\nEncerrando Nova Era 2.0 (${signal})...`);
  clearTimeout(reconnectTimer);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startBot().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
