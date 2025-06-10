import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

let handler = async (m, { conn, args }) => {
  const url = args[0];
  if (!url || !ytdl.validateURL(url)) {
    return m.reply('❗ Por favor ingresa un enlace válido de YouTube.');
  }

  await conn.sendMessage(m.chat, { react: { text: '📥', key: m.key } });
  const statusMsg = await conn.sendMessage(m.chat, { text: '📡 *Procesando… descarga en curso…*' }, { quoted: m });

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudioandvideo' });

    const MAX_BYTES = 600 * 1024 * 1024;
    const fileSize = format.contentLength ? parseInt(format.contentLength) : 0;

    if (fileSize && fileSize > MAX_BYTES) {
      await conn.sendMessage(m.chat, { text: '❌ El video excede los 600 MB permitidos.' }, { quoted: statusMsg });
      return;
    }

    const filename = `${Date.now()}_${info.videoDetails.videoId}.mp4`;
    const filepath = path.join(os.tmpdir(), filename);
    const writeStream = fs.createWriteStream(filepath);

    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { quality: format.itag });

      let downloaded = 0;
      stream.on('data', chunk => {
        downloaded += chunk.length;
        if (downloaded > MAX_BYTES) {
          stream.destroy();
          writeStream.close();
          return reject(new Error('Límite excedido'));
        }
      });

      stream.on('error', err => reject(err));
      writeStream.on('error', err => reject(err));
      writeStream.on('finish', resolve);
      stream.pipe(writeStream);
    });

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(filepath),
      fileName: `${info.videoDetails.title}.mp4`,
      mimetype: 'video/mp4',
      caption: `🎬 *${info.videoDetails.title}*\n📦 Enviado como documento`,
    }, { quoted: m });

    fs.unlinkSync(filepath);
    await conn.sendMessage(m.chat, { text: '✅ Video enviado con éxito.' }, { quoted: m });

  } catch (e) {
    console.error(e);
    const errMsg = e.message.includes('Límite excedido')
      ? '❌ El video excede los 600 MB!'
      : '❌ Error durante descarga o envío.';
    await conn.sendMessage(m.chat, { text: errMsg }, { quoted: m });
  }
};

handler.command = ['ytbigdoc'];
handler.tags = ['downloader'];
handler.help = ['ytbigdoc <enlace de YouTube>'];

export default handler;