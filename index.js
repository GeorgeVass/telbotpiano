const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const scribble = require('scribbletune');
const token = '757989592:AAGoa7NLRDX-J0FNPUQ1xbYs3YnK12JNAAs';
const bot = new (require('telegraf'))(token);
const telegram = new (require('telegraf/telegram'))(token);
const midi = util.promisify(scribble.midi);

async function textToMidi(title, notes, pattern) {
  await midi(scribble.clip({
    notes: notes,
    pattern: (pattern || 'x-'.repeat(notes.length)),
  }), './tracks/'+title+'.mid')
}

async function midiToMp3(fileName) {
  await exec(`timidity ./tracks/${fileName}.mid -Ow -o - | lame - -b 64 ./tracks/${fileName}.mp3`);
} 

bot.start(ctx => ctx.reply('Welcome, send me notes in format \n *unique title* *notes*'))
bot.help(ctx => ctx.reply('Send me notes in format \n *unique title* *notes*'))

bot.on('text', ctx => {
  const msg = ctx.update.message.text.split(' ');
  const title = msg.shift() + ctx.update.message.from.id;
  const pattern = msg.join('').replace(/\d/g, '').replace(/[^_-]/g, 'x');
  const notes = msg.join('').replace(/_|-/g, ' ').split(' ').filter(x=>x);
  console.log({title, msg, notes, pattern})
  textToMidi(title, notes, pattern)
    .then(midiToMp3(title))
    .then(setTimeout(() => telegram.sendAudio(
      ctx.update.message.from.id,
      {
        source: fs.readFileSync('./tracks/'+title+'.mp3'),
        filename: title+'.mp3'
      },   
      {
        performer: ctx.update.message.from.username,
        title: title, 
      }
    ), 1000)
  )}
)

bot.launch()
