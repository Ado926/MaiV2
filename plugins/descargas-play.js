import Starlights from '@StarlightsTeam/Scraper'
import yts from 'yt-search'
import fetch from 'node-fetch'

let handler = async (m, { conn, args, usedPrefix, text, command }) => {
  let formatos = ["mp3", "mp4", "mp3doc", "mp4doc"]
  let [formato, ...busqueda] = text.split(" ")

  if (!formatos.includes(formato)) {
    return conn.reply(
      m.chat,
      `┌──〔 *Formato inválido* 〕──✿\n` +
      `│ 🧩 *Usa el comando así:*\n` +
      `│ ${usedPrefix + command} mp3 Alan Walker\n` +
      `│\n` +
      `│ ✨ *Formatos disponibles:*\n` +
      `│ 🎧 mp3 (audio)\n` +
      `│ 📄 mp3doc (audio en doc)\n` +
      `│ 🎥 mp4 (video)\n` +
      `│ 📄 mp4doc (video en doc)\n` +
      `└───────────────♡`,
      m, rcanal
    )
  }

  if (!busqueda.length) {
    return conn.reply(
      m.chat,
      `┌──〔 *Falta la búsqueda* 〕──✿\n` +
      `│ 🔍 Escribe el título o nombre del video\n` +
      `│\n` +
      `│ 🧸 *Ejemplo:*\n` +
      `│ ${usedPrefix + command} mp4 Aimer - Brave Shine\n` +
      `└───────────────♡`,
      m, rcanal
    )
  }

  await m.react('⌛')

  let res = await yts(busqueda.join(" "))
  let video = res.videos[0]

  let caption = `┌──〔 🎶 *Resultado encontrado* 〕──✿\n`
  caption += `│ 💿 *Título:* ${video.title}\n`
  caption += `│ ⏱️ *Duración:* ${video.timestamp}\n`
  caption += `│ 👁️ *Vistas:* ${formatNumber(video.views)}\n`
  caption += `│ 🎤 *Autor:* ${video.author.name}\n`
  caption += `│ 📅 *Publicado:* ${eYear(video.ago)}\n`
  caption += `│ 🔗 *Link:* https://youtu.be/${video.videoId}\n`
  caption += `└───────────────♡\n\n`
  caption += `🌟 *Enviando archivo... espera un momento, ten paciencia :)*`

  await conn.sendFile(m.chat, video.thumbnail, 'thumb.jpg', caption, m, rcanal)

  try {
    let data = formato.includes('mp3') ? await Starlights.ytmp3(video.url) : await Starlights.ytmp4(video.url)
    let isDoc = formato.includes('doc')
    let mimetype = formato.includes('mp3') ? 'audio/mpeg' : 'video/mp4'

    await conn.sendMessage(
      m.chat,
      {
        [isDoc ? 'document' : formato.includes('mp3') ? 'audio' : 'video']: { url: data.dl_url },
        mimetype,
        fileName: `${data.title}.${formato.includes('mp3') ? 'mp3' : 'mp4'}`
      },
      { quoted: m }
    )

    await m.react('✅')
  } catch (e) {
    console.error(e)
    await m.react('❌')
    conn.reply(
      m.chat,
      `✖️ *Oops... algo salió mal*\n\n` +
      `Por favor intenta nuevamente en unos instantes 🥺`,
      m, rcanal
    )
  }
}

handler.help = ['play2 <formato> <búsqueda>']
handler.tags = ['download']
handler.command = ['ytplay', 'play2']
export default handler

function eYear(txt) {
  if (!txt) return '×'
  const replacements = [
    ['month ago', 'mes'], ['months ago', 'meses'],
    ['year ago', 'año'], ['years ago', 'años'],
    ['hour ago', 'hora'], ['hours ago', 'horas'],
    ['minute ago', 'minuto'], ['minutes ago', 'minutos'],
    ['day ago', 'día'], ['days ago', 'días']
  ]
  for (const [en, es] of replacements) {
    if (txt.includes(en)) return 'hace ' + txt.replace(en, es).trim()
  }
  return txt
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}