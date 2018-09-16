import { Client, Guild, GuildMember, TextChannel, User, Message } from 'discord.js';
import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
const mkdirp = require('mkdirp');

interface Mapping {
    [key: string]: string
}

const confFilePath = joinPath(__dirname, '..', 'conf', 'conf.json');
if (!existsSync(confFilePath)) {
    console.error('Conf file does not exist.');
    process.exit(1);
}

const conf = JSON.parse(readFileSync(confFilePath, 'utf8'));
const token = conf.key;

const mappingsDirPath = joinPath(__dirname, '..', 'mappings');
try {
    if (!existsSync(mappingsDirPath)) {
        mkdirp.sync(mappingsDirPath);
    }
}
catch (error) {
    console.error('I/O error mappings dir.', error);
    process.exit(1);
}

const gifMappingsFilePath = joinPath(mappingsDirPath, 'gif.json');
try {
    if (!existsSync(gifMappingsFilePath)) {
        writeFileSync(gifMappingsFilePath, JSON.stringify({}), 'utf8');
    }
}
catch (error) {
    console.error('I/O error gif mappings file.', error);
    process.exit(1);
}

const gifMappings: Mapping = JSON.parse(readFileSync(gifMappingsFilePath, 'utf8'));


const client: Client = new Client();
client.on('ready', () => {
    console.log('My body is ready!');

    client.guilds.forEach((guild: Guild) => {
        const bot: GuildMember = <GuildMember>guild.members.get(client.user.id);
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
    const content: string = message.content;

    try {
        if (content.startsWith('/save')) {
            const parts: Array<string> = content.split(/[ ]+/);
            if (parts.length !== 3) {
                try {
                    await message.channel.send(`${author} ¿Qué quieres que haga con esto? Háblame bien.`);
                }
                catch (error) {
                    console.error('Something happened.', error);
                }
            }

            const key: string = parts[1];
            const url: string = parts[2];
            if (gifMappings[key]) {
                try {
                    await message.channel.send(`${author} Pfff, ${key} otra vez? Seguro que se te ocurre algo nuevo que enseñarme... 😉`);
                }
                catch (error) {
                    console.error('Something happened.', error);
                }
            }

            gifMappings[key] = url;
            writeFile(gifMappingsFilePath, JSON.stringify(gifMappings), 'utf8', async (error) => {
                if (error) {
                    return;
                }

                try {
                    await message.channel.send(`${author} He aprendido un nuevo truco: ${key}. 😘`);
                    await message.delete();
                }
                catch (error) {
                    console.error('Something happened.', error);
                }
            });

            return;
        }

        if (content.startsWith('/')) {
            const key = message.content.toLowerCase().substring(1, message.content.length);
            const url = gifMappings[key];
            if (url) {
                await message.channel.send(`${author} ${url}`);
                await message.delete();
            }
            return;
        }

        /*
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
        */
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
