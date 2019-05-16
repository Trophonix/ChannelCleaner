const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

var stuff = require('./stuff.json');

client.on('ready', async () => {
  console.log('Logged in!');
  let g = client.guilds.get('339397276927524874');
  if (g) g.leave();
  client.user.setPresence({ game: { name: 'cln help' }, status: 'online' });
  client.user.setAvatar('./avatar.png', );
  stuff = stuff.filter(async entry => {
    let guild = client.guilds.get(entry.guildId);
    if (!guild) return false;
    let channel = guild.channels.get(entry.channelId);
    if (!channel) return false;
    let meMember = await guild.member(client.user);
    if (!meMember.hasPermission('MANAGE_MESSAGES', false, true, true) && !channel.permissionsFor(meMember).has('MANAGE_MESSAGES', true)) {
      return false;
    }
    return true;
  });
  setInterval(async () => {
    stuff.forEach(async entry => {
      let guild = client.guilds.get(entry.guildId);
      if (!guild) return;
      let channel = guild.channels.get(entry.channelId);
      if (!channel) return;
      console.log(`(${guild.id}|${guild.name}) [${channel.id}|${channel.name}]`);
      let meMember = await guild.member(client.user);
      if (!meMember.hasPermission('MANAGE_MESSAGES', false, true, true) && !channel.permissionsFor(meMember).has('MANAGE_MESSAGES', true)) {
        return;
      }
      let messages = (await channel.fetchMessages({limit:100})).array();
      for (let index = messages.length - 1; index > -1; index--) {
        let message = messages[index];
        if ((messages.length === 100 && index > messages.length - 20) || message.createdTimestamp <= Date.now() - (entry.time * 1000)) {
          await message.delete().catch(console.error);
        } else {
          break;
        }
      }
    });
  }, 5000);
});

client.on('message', async event => {
  let message = event.content;
  if (message.startsWith('cln ')) {
    let member = await event.guild.member(event.author);
    if (!member.hasPermission('MANAGE_MESSAGES', false, true, true)) {
      event.channel.send(`Sorry ${event.author}, you need the manage messages permission (or administrator) to use me.`).catch(console.error);
      return;
    }
    let meMember = await event.guild.member(client.user);
    if (!meMember.hasPermission('MANAGE_MESSAGES', false, true, true) && !channel.permissionsFor(meMember).has('MANAGE_MESSAGES', true)) {
      event.channel.send(`Sorry ${event.author}, I need the manage messages permission (or administrator) to use that.`).catch(console.error);
      return;
    }
    var args = message.split(' ');
    var command = args[1];
    args.splice(0, 2);
    var del = true;
    if (command === 'now') {
      let messages = (await event.channel.fetchMessages({limit: 100})).array();
      var amount = messages.length;
      if (args[0]) {
        amount = Math.min(100, parseInt(args[0]) + 1);
      }
      event.channel.send(`Okay. Deleting ${amount - 1} messages from ${event.channel.toString()}. This will take approximately ${amount * 250 / 1000} seconds due to rate limits.`)
        .then(sent => sent.delete(amount * 250 + 100).catch(console.error)).catch(console.error);
      for (let index = 0; index < amount; index++) {
        let msg = messages[index];
        if (!msg) continue;
        msg.delete((index + 1) * 250).then(deleted => {
          if (index === amount - 1) {
            event.channel.send(`Successfully deleted ${amount - 1} messages from ${event.channel.toString()}`).then(sent => 
              sent.delete(3000).catch(console.error)
            ).catch(console.error);
          }
        }).catch(console.error);
      }
    } else if (command === 'after') {
      if (args.length == 0) {
        event.channel.send('Incorrect usage! Use `cln after (time in seconds)`').send({embed}).then(sent => sent.delete(9000).catch(console.error)).catch(console.error);
        return;
      }
      let time = parseInt(args[0]);
      let index = stuff.indexOf(stuff.find(entry => entry.guildId === event.guild.id && entry.channelId === event.channel.id));
      if (index > -1) stuff.splice(index, 1);
      stuff.push({
        guildId: event.guild.id,
        channelId: event.channel.id,
        time
      });
      fs.writeFile('./stuff.json', JSON.stringify(stuff), err => {
        if (err) console.error(err);
      });
      event.channel.send(`Alright! I'll delete any messages in ${event.channel.toString()} when they reach ${time} seconds old.`).then(sent => 
        sent.delete(9000).catch(console.error)).catch(console.error);
    } else if (command === 'list') {
      var filteredStuff = stuff.filter(entry => entry.guildId === event.guild.id);
      if (filteredStuff.length == 0) {
        event.channel.send('I am not configured to delete any messages automatically in this guild.').send({embed}).then(sent => sent.delete(9000).catch(console.error)).catch(console.error);
        return;
      }
      var messageToSend = 'I am configured to delete messages in this guild as follows:\n';
      filteredStuff.forEach(entry => {
        messageToSend += ` - ${event.guild.channels.get(entry.channelId)} over ${entry.time} seconds old\n`
      });
      event.channel.send(messageToSend).send({embed}).then(sent => sent.delete(9000).catch(console.error)).catch(console.error);
    } else if (command === 'help') {
      let embed = new Discord.RichEmbed()
        .setColor('GREEN')
        .setTitle('How to use Channel Cleaner')
        .addField('cln now', 'Clean up to 100 messages in this channel right now')
        .addField('cln now (amount < 100)', 'Clean (amount) messages in this channel right now')
        .addField('cln after (time in seconds)', 'Clean messages over (time) old')
        .addField('cln list', 'See a cleaning list for this guild');
      event.channel.send({embed}).then(sent => sent.delete(9000).catch(console.error)).catch(console.error);
    } else {
      del = false;
    }
    if (del) {
      event.delete(9000).catch(console.error);
    }
  }
});

client.on('channelDelete', channel => {
  stuff = stuff.filter(entry => channel.id != entry.channelId);
});

client.on('guildDelete', guild => {
  stuff = stuff.filter(entry => guild.id != entry.guildId);
});

let botId = 'BOT ID HERE';
client.login(botId).catch(console.error);
