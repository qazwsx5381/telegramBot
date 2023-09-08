require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio')
const TelegramBot = require('node-telegram-bot-api')


const token = process.env.telegram

const bot = new TelegramBot(token, { polling: true })

const arr_receive = [
  '안녕',
  '이름',
  '잘가',
  '음악실시간',
  '가수 (artist명)',
  '보여줘 (저장한 사진이름)',
  '사진지워'
]
const arr_send = ['반가워요', '저는 Bot이에요', '또 만나요~']
let photo = []

bot.onText(/^!명령어/, (msg, match) => {
  const chatId = msg.chat.id
  const resp = arr_receive.join(', ')

  bot.sendMessage(chatId, resp)
})

bot.onText(/^보여줘/, (msg, match) => {
  let savename = msg.text.substring(4)
  photo.forEach((v) => {
    if (v.savename == savename) {
      bot.sendPhoto(v.chatId, v.chatPhoto)
    }
  })
})

bot.onText(/^사진지워/, (msg, match) => {
  const chatId = msg.chat.id
  photo = []
  bot.sendMessage(chatId, '저장된 사진을 지웠습니다.')
})

const url = 'https://www.melon.com/'
axios.get(url).then((res) => {
  const $ = cheerio.load(res.data)
  const song = []
  const artist = []
  const chartTop10 = []
  $('.rank_info .song .mlog').each(function () {
    song.push($(this).text())
  })
  $('.rank_info .artist .ellipsis .checkEllipsisRealtimeChart .mlog').each(
    function () {
      artist.push($(this).text())
    }
  )
  artist.forEach((v, i) => {
    chartTop10.push({ rank: i + 1, song: song[i], artist: v })
  })

  chartTop10.forEach((v) => {
    chartTop10.push(`${v.rank}위 ${v.song}-${v.artist}`)
  })
  chartTop10.splice(0, 10)
  chartTop10.unshift(`현재 멜론 실시간 차트(${time()}시 기준)`)
  arr_send.push(chartTop10.join('\n'))
})

bot.onText(/^가수/, (msg, match) => {
  const chatId = msg.chat.id
  const encode_artist = encodeURI(msg.text.substring(3))
  const url = `https://www.melon.com/search/total/index.htm?q=${encode_artist}&section=&searchGnbYn=Y&kkoSpl=Y&kkoDpType=&mwkLogType=T`
  axios.get(url).then((res) => {
    const $ = cheerio.load(res.data)
    const song = []
    const songs = []
    $(
      '.tb_list.d_song_list.songTypeOne .t_left .wrap.pd_none .ellipsis .fc_gray'
    ).each(function () {
      if (song.length < 10) song.push($(this).text())
    })
    let artist = $('.info_01 strong.fc_serch').text()
    song.forEach((v) => {
      songs.push(`${v} - ${artist}`)
    })
    songs.unshift(`${artist}의 곡은?`)
    bot.sendMessage(chatId, songs.join(`\n`))
  })
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id
  console.log(msg)
  if (msg.photo && msg.caption) {
    const chatPhoto = msg.photo[0].file_id
    const savename = msg.caption
    photo.push({ chatId, chatPhoto, savename })
    console.log(photo)
  }
  msg.text === '!명령어' || msg.text.includes('가수')
    ? ''
    : arr_receive.indexOf(msg.text) >= 0
    ? bot.sendMessage(chatId, arr_send[arr_receive.indexOf(msg.text)])
    : ''
  // : bot.sendMessage(chatId, '메세지를 받았습니다')
})
