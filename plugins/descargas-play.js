import fetch from 'node-fetch';

const ENCRYPTED_SEARCH_API = 'aHR0cDovLzE3My4yMDguMjAwLjIyNzozMjY5L3NlYXJjaF95b3V0dWJlP3F1ZXJ5PQ==';
const ENCRYPTED_DOWNLOAD_VIDEO_API = 'aHR0cDovLzE3My4yMDguMjAwLjIyNzozMjY5L2Rvd25sb2FkX3ZpZGVvP3VybD0=';

function decryptBase64(str) {
  return Buffer.from(str, 'base64').toString();
}

let handler = async (m, { text, conn, command }) => {
  if (!text) return m.reply('🔍 Ingresa el nombre del video. Ejemplo: *.play2 Usewa Ado*');

  try {
    const searchAPI = decryptBase64(ENCRYPTED_SEARCH_API);
    const downloadVideoAPI = decryptBase64(ENCRYPTED_DOWNLOAD_VIDEO_API);

    const searchRes = await fetch(`${searchAPI}${encodeURIComponent(text)}`);
    const searchJson = await searchRes.json();

    if (!searchJson.results || !searchJson.results.length) {
      return m.reply('⚠️ No se encontraron resultados para tu búsqueda.');
    }

    const video = searchJson.results[0];
    const thumb = video.thumbnails.find(t => t.width === 720)?.url || video.thumbnails[0]?.url;
    const videoTitle = video.title;
    const videoUrl = video.url;
    const duration = Math.floor(video.duration);
    const channel = video.channel || 'Desconocido';
    const views = video.views ? video.views.toLocaleString() : 'N/A';

    const msgInfo = `
┏━━━━━━━━━━━━━━⬣
┃ 🎬 *Título:* ${videoTitle}
┃ 📺 *Canal:* ${channel}
┃ ⏱️ *Duración:* ${duration}s
┃ 👁️ *Vistas:* ${views}
┃ 🔗 *URL:* ${videoUrl}
┗━━━━━━━━━━━━━━⬣
📥 *Enviando video...* Un momento, soy un poco lenta (˶˃ ᵕ ˂˶)
`.trim();

    await conn.sendMessage(m.chat, { image: { url: thumb }, caption: msgInfo }, { quoted: m });

    const downloadRes = await fetch(`${downloadVideoAPI}${encodeURIComponent(videoUrl)}`);
    const downloadJson = await downloadRes.json();

    if (!downloadJson.file_url) return m.reply('❌ No se pudo descargar el video.');

    // Verificar tamaño
    const headRes = await fetch(downloadJson.file_url, { method: 'HEAD' });
    const fileSize = parseInt(headRes.headers.get('content-length')) || 0;
    const MAX_SIZE = 600 * 1024 * 1024;
    const LIMIT_DIRECT = 89 * 1024 * 1024;

    if (fileSize > MAX_SIZE) {
      return m.reply('❌ El video excede el límite de 600 MB.');
    }

    const asDocument = fileSize > LIMIT_DIRECT;

    await conn.sendMessage(m.chat, {
      [asDocument ? 'document' : 'video']: { url: downloadJson.file_url },
      mimetype: 'video/mp4',
      fileName: `${downloadJson.title}.mp4`
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Error al procesar tu solicitud.');
  }
};

handler.command = ['play2', 'mp4', 'ytmp4', 'playmp4'];
handler.help = ['play2 <video>'];
handler.tags = ['downloader'];

export default handler;