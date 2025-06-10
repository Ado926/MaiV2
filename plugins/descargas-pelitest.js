import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

let handler = async (m, { conn, args, command }) => {
  const url = args[0];
  if (!url || !ytdl.validateURL(url)) return m.reply('❗ Ingresa un enlace válido de YouTube.');

  await conn.sendMessage(m.chat, { react: { text: '📥', key: m.key } });
  m.reply('📡 *Procesando video, espera unos segundos...*');

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
    const fileSize = parseInt(format.contentLength || '0');

    const MAX_SIZE = 600 * 1024 * 1024;
    if (fileSize > MAX_SIZE) return m.reply('❌ El video excede los 600 MB permitidos.');

    const fileName = `${randomUUID()}.mp4`;
    const filePath = path.join(tmpdir(), fileName);

    const videoStream = ytdl(url, { quality: 'highest', filter: 'audioandvideo' });

    const fileWriteStream = fs.createWriteStream(filePath);
    videoStream.pipe(fileWriteStream);

    await new Promise((resolve, reject) => {
      fileWriteStream.on('finish', resolve);
      fileWriteStream.on('error', reject);
    });

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(filePath),
      fileName: `${title}.mp4`,
      mimetype: 'video/mp4',
      caption: `🎬 *${title}*\n🗂️ Enviado como documento (calidad máxima)`
    }, { quoted: m });

    fs.unlinkSync(filePath); // Limpieza
  } catch (e) {
    console.error(e);
    m.reply('❌ Error al descargar o enviar el video.');
  }
};

handler.command = ['ytbigdoc'];
handler.help = ['ytbigdoc <enlace>'];
handler.tags = ['downloader'];

export default handler;