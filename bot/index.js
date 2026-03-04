const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// --- 입력값 sanitize ---
function sanitizeInput(input) {
  // 쉘 메타문자 제거: 명령 주입 방지
  const dangerous = /[;&|`$(){}[\]<>\\!#\n\r]/g;
  return input.replace(dangerous, '');
}

// --- 메시지 분할 전송 (2000자 제한) ---
async function sendLongMessage(channel, text) {
  const MAX = 1950; // 여유분 확보
  if (text.length <= MAX) {
    await channel.send(text);
    return;
  }

  const lines = text.split('\n');
  let chunk = '';

  for (const line of lines) {
    if (chunk.length + line.length + 1 > MAX) {
      if (chunk) await channel.send(chunk);
      // 한 줄이 MAX보다 긴 경우
      if (line.length > MAX) {
        for (let i = 0; i < line.length; i += MAX) {
          await channel.send(line.slice(i, i + MAX));
        }
        chunk = '';
      } else {
        chunk = line + '\n';
      }
    } else {
      chunk += line + '\n';
    }
  }

  if (chunk.trim()) {
    await channel.send(chunk);
  }
}

// --- Claude CLI 실행 ---
function runClaude(prompt, cwd) {
  return new Promise((resolve, reject) => {
    const args = ['--print', '--cwd', cwd, prompt];
    const proc = spawn('claude', args, {
      cwd,
      shell: true,
      timeout: 300000, // 5분 타임아웃
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim() || '(응답 없음)');
      } else {
        reject(new Error(stderr.trim() || `Claude CLI exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// --- 메시지 처리 ---
client.on('messageCreate', async (message) => {
  // 봇 메시지 무시
  if (message.author.bot) return;

  const channelId = message.channel.id;
  const projectConfig = config.channelProjects[channelId];

  // 매핑되지 않은 채널은 무시
  if (!projectConfig) return;

  let prompt = null;

  // 1. 봇 멘션으로 시작
  if (message.mentions.has(client.user)) {
    prompt = message.content.replace(/<@!?\d+>/g, '').trim();
  }
  // 2. prefix로 시작
  else if (message.content.startsWith(config.prefix)) {
    prompt = message.content.slice(config.prefix.length).trim();
  }

  if (!prompt) return;

  // 입력값 sanitize
  prompt = sanitizeInput(prompt);

  if (!prompt) {
    await message.reply('메시지 내용이 비어있습니다.');
    return;
  }

  // typing indicator
  const typing = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 5000);
  await message.channel.sendTyping().catch(() => {});

  try {
    console.log(`[${projectConfig.name}] ${message.author.tag}: ${prompt}`);
    const result = await runClaude(prompt, projectConfig.cwd);
    await sendLongMessage(message.channel, result);
  } catch (err) {
    console.error('Claude CLI error:', err.message);
    await message.reply(`오류가 발생했습니다:\n\`\`\`\n${err.message.slice(0, 1500)}\n\`\`\``);
  } finally {
    clearInterval(typing);
  }
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  console.log(`Prefix: "${config.prefix}"`);
  console.log('Channel mappings:');
  for (const [id, proj] of Object.entries(config.channelProjects)) {
    console.log(`  #${id} -> ${proj.name} (${proj.cwd})`);
  }
});

// --- 시작 ---
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('DISCORD_BOT_TOKEN이 .env 파일에 설정되지 않았습니다.');
  process.exit(1);
}

client.login(token);
