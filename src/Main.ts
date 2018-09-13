import { Client, Guild, GuildMember, TextChannel, User } from 'discord.js';
import { readFileSync } from 'fs';
import { join as joinPath } from 'path';

interface Mapping {
    [key: string]: string
}

const conf = JSON.parse(readFileSync(joinPath(__dirname, '..', 'conf', 'conf.json'), 'utf8'));
const token = conf.key;
const botId = conf.botId;

const client: Client = new Client();

client.on('ready', () => {
    console.log('My body is ready!');

    client.guilds.forEach((guild: Guild) => {
        const bot: GuildMember = <GuildMember>guild.members.get(botId);
        bot.setNickname('Cortana');
    });

    /*
    const channel: TextChannel = <TextChannel>guild.channels.get(id);
    if (!channel) {
        return;
    }
    */
});

client.on('message', async (message) => {
    const author: User = message.author;

    try {
        if (message.content.startsWith('/')) {
            const mappings: Mapping = {
                coach: 'https://www.tenor.co/ZUs5.gif',
                flute: 'https://www.tenor.co/Uqc7.gif'
            };

            const url = mappings[message.content.toLowerCase().substring(1, message.content.length)];
            if (url) {
                await message.channel.send(`${author} ${url}`);
                await message.delete();
            }
            return;
        }

        const containsCortana: boolean = message.content.toLowerCase().includes('cortana');
        const mentionsCortana: boolean = !!message.mentions.users.get(client.user.id);
        if (containsCortana) {
            message.channel.send(`${author} 🍍 ¡Recuerda comprar fruta fresca hoy! 🍋`);
            return;
        }

        if (mentionsCortana) {
            message.channel.send(`To' fresca la frutita.`, {
                tts: true
            });
        }
    }
    catch (error) {
        console.error('Something happened.', error);
    }
});

client.login(token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch((error) => {
        console.error('Error logging in.', error);
        process.exit(1);
    });
