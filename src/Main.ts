import { Client, Guild, GuildMember, TextChannel, User, Message } from 'discord.js';
import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
import { isWebUri } from 'valid-url';
import { promisify } from 'util';
const mkdirp = require('mkdirp');

interface Mapping {
    [key: string]: string
}

const writeFileAsync = promisify(writeFile);

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

const imgMappingsFilePath = joinPath(mappingsDirPath, 'img.json');
try {
    if (!existsSync(imgMappingsFilePath)) {
        writeFileSync(imgMappingsFilePath, JSON.stringify({}), 'utf8');
    }
}
catch (error) {
    console.error('I/O error img mappings file.', error);
    process.exit(1);
}

const imgMappings: Mapping = JSON.parse(readFileSync(imgMappingsFilePath, 'utf8'));


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
    const content: string = message.content;
    if (content.startsWith('/save')) {
        try {
            await saveHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/debug')) {
        try {
            await debugHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    try {
        if (content.startsWith('/')) {
            const key = content.toLowerCase().substring(1, content.length);
            const url = imgMappings[key];
            if (url) {
                const author: User = message.author;
                await message.channel.send(`${author} ${url}`);
                await message.delete();
            }
            return;
        }
    }
    catch (error) {
        console.error('Something happened.', error);
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
});

client.login(token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch((error) => {
        console.error('Error logging in.', error);
        process.exit(1);
    });

async function saveHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 3) {
        await message.channel.send(`${author} Háblame bien. #NoEsNo http://www.radiopineda.cat/sites/default/files/field/image/noesno.jpg`);
        return;
    }

    const url: string = parts[2].trim();
    if (!isWebUri(url)) {
        await message.channel.send(`${author} ¿Qué quieres que haga con esto? Dame una URL y te daré algo mejor a cambio... 🍑`);
        return;
    }

    const key: string = parts[1].trim();
    if (imgMappings[key]) {
        await message.channel.send(`${author} Pfff, ${key} otra vez? Seguro que se te ocurre algo nuevo que enseñarme... 😉`);
        return;
    }

    imgMappings[key] = url;
    await writeFileAsync(imgMappingsFilePath, JSON.stringify(imgMappings), 'utf8')
    await message.channel.send(`${author} He aprendido un nuevo truco: ${key}. 😘`);
    await message.delete();
}

async function debugHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 2) {
        await message.channel.send(`${parts.length - 1} params received, 1 expected.`);
        return;
    }

    const param: string = parts[1].trim();
    switch (param) {
        case 'info':
        case 'print-img':
            await message.channel.send(JSON.stringify(imgMappings));
            return;
        default:
            await message.channel.send(`Unknown command ${param}`);
    }
}
