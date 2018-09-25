import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
import { promisify } from 'util';

import { sync as mkdirSync } from 'mkdirp';
import { isWebUri } from 'valid-url';
import {
    Client,
    Collection,
    Emoji,
    Guild,
    GuildMember,
    Message,
    User
} from 'discord.js';

import { appConfService, DiscordConf } from './services/app-conf.service';

interface MapFile {
    [key: string]: string
}

const writeFileAsync = promisify(writeFile);
const conf: DiscordConf = appConfService.discordConf;

// Mappings dir
const mapsDirname: string = 'maps';
const mapsDirPath = joinPath(__dirname, '..', mapsDirname);
try {
    if (!existsSync(mapsDirPath)) {
        mkdirSync(mapsDirPath);
    }
}
catch (error) {
    console.error('I/O error mappings dir.', error);
    process.exit(1);
}

function getMappingFileContentsSync(path:string, defaultContents: any): MapFile | Array<string> {
    try {
        if (!existsSync(path)) {
            writeFileSync(path, JSON.stringify(defaultContents), 'utf8');
        }
    }
    catch (error) {
        console.error('I/O error img mappings file.', error);
        process.exit(1);
    }
    return JSON.parse(readFileSync(path, 'utf8'));
}

// URL mapping file
const urlMapFilename: string = 'url.json';
const urlMapFilePath: string = joinPath(mapsDirPath, urlMapFilename);
const urlMap: MapFile = <MapFile>getMappingFileContentsSync(urlMapFilePath, {});

// Emoji mapping file
const emojiMapFilename: string = 'emoji.json';
const emojiMapFilePath: string = joinPath(mapsDirPath, emojiMapFilename);
let emojiMap: MapFile = <MapFile>getMappingFileContentsSync(emojiMapFilePath, {});

// Conversation mapping file
const conversationMapFilename: string = 'conversation.json';
const conversationMapFilePath: string = joinPath(mapsDirPath, conversationMapFilename);
const conversationMap: Array<string> = <Array<string>>getMappingFileContentsSync(conversationMapFilePath, []);


// BOT
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

client.on('message', async (message: Message) => {
    const content: string = message.content;

    const mentionsCortana: boolean = !!message.mentions.users.get(client.user.id);
    if (mentionsCortana) {
        try {
            await mentionHandler(message);
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

    if (content.startsWith('/delete')) {
        try {
            await deleteImgHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/emoji')) {
        try {
            await emojiHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/help')) {
        try {
            await helpHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/info')) {
        try {
            await infoHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/list')) {
        try {
            await listHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/save')) {
        try {
            await saveHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    if (content.startsWith('/update')) {
        try {
            await updateImgHandler(message);
        }
        catch (error) {
            console.error('Something happened.', error);
        }
        return;
    }

    try {
        if (content.startsWith('/')) {
            const key = content.toLowerCase().substring(1, content.length);
            const url = urlMap[key];
            if (url) {
                const author: User = message.author;

                await message.channel.send(`${author} - ${key}`, {
                    embed: {
                        url
                    }
                });
                await message.delete();
            }
            return;
        }
    }
    catch (error) {
        console.error('Something happened.', error);
    }
});

client.login(conf.token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch((error) => {
        console.error('Error logging in.', error);
        process.exit(1);
    });

async function mentionHandler(message: Message): Promise<void> {
    if (!conversationMap.length) {
        return;
    }

    const { author } = message;
    const randMessage = conversationMap[Math.floor(Math.random()*conversationMap.length)];
    message.channel.send(`${author} ${randMessage}`, {
        tts: true
    });
}

async function deleteImgHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 2) {
        await message.channel.send(`${author} Háblame bien. #NoesNo`);
        return;
    }

    const key: string = parts[1].trim();
    if (urlMap[key]) {
        delete urlMap[key];
    }

    await writeFileAsync(urlMapFilePath, JSON.stringify(urlMap), 'utf8');
    await message.channel.send(`${author} Ok, he borrado ${key}, pero ni se te ocurra borrarme a mi.`);
    await message.delete();
}

async function emojiHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 2) {
        await message.channel.send(`${author} Háblame bien. #NoesNo`);
        return;
    }

    const param: string = parts[1].trim();
    const guild: Guild = message.guild;
    const emojis: Collection<string, Emoji> = guild.emojis;
    switch (param) {
        case 'init':
            emojiMap = {};
            emojis.forEach(e => emojiMap[e.name] = e.url);

            await writeFileAsync(emojiMapFilePath, JSON.stringify(emojiMap), 'utf8');
            await message.channel.send(`${message.author} Emojis memorizados.`);
            await message.delete();
            return;
        case 'sync':
            await message.channel.send(`${message.author} Not implemented, lol.`);
            return;
        default:
            await message.channel.send(`${author} Porque no pruebas con: init, sync.`);
    }

    if (urlMap[param]) {
        delete urlMap[param];
    }

    await writeFileAsync(urlMapFilePath, JSON.stringify(urlMap), 'utf8');
    await message.channel.send(`${author} Ok, he borrado ${param}, pero ni se te ocurra borrarme a mi.`);
    await message.delete();
}

async function helpHandler(message: Message): Promise<void> {
    if (message.author.id === client.user.id) {
        return;
    }

    const helpMessage: Array<string> = [
        '',
        '/help - Show this help',
        '/info - Get some basic info about me',
        '/list <param> - Get a list of all available elements: url, emoji',
        '/save <name> <url> - Save a new url',
        '/update <name> <url> - Update an existing url',
        '/delete <name> - Delete an existing url'
    ];

    await message.channel.send(`${message.author} ${helpMessage.join('\n')}`)
    await message.delete();
}

async function infoHandler(message: Message): Promise<void> {
    await message.channel.send('Author: Adrian Hintze @Rydion\nRepository: https://github.com/Rydion/discord-bot\nUse "/help" for more commands');
}

async function listHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 2) {
        await message.channel.send(`${author} Háblame bien. #NoesNo`);
        return;
    }

    const param: string = parts[1];
    let responseContent: string = '\n';
    const names: Array<string> = [''];
    switch (param) {
        case 'url':
            for (let key in urlMap) {
                names.push(`${key} - <${urlMap[key]}>`);
            }

            names.sort((a, b) => a < b ? -1 : 1);

            responseContent += 'Esto es lo que te puedo enseñar:';
            responseContent += names.join('\n');

            await message.channel.send(`${message.author} ${responseContent}`);
            await message.delete();
            return;
        case 'emoji':
            const guild: Guild = message.guild;
            if (!guild) {
                return;
            }

            const emojis: Collection<string, Emoji> = guild.emojis;
            emojis.forEach(e => names.push(`${e.name} - ${e.toString()}`));

            names.sort((a, b) => a < b ? -1 : 1);

            responseContent += 'Estos son los emoji disponibles:';
            responseContent += names.join('\n');

            await message.channel.send(`${message.author} ${responseContent}`);
            await message.delete();
            return;
        default:
            await message.channel.send(`${author} Porque no pruebas con: url, emoji.`);
    }
}

async function saveHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 3) {
        await message.channel.send(`${author} Háblame bien. #NoesNo`);
        return;
    }

    const url: string = parts[2].trim();
    if (!isWebUri(url)) {
        await message.channel.send(`${author} ¿Qué quieres que haga con esto? Dame una URL y te daré algo mejor a cambio... 🍑`);
        return;
    }

    const key: string = parts[1].trim();
    if (urlMap[key]) {
        await message.channel.send(`${author} Pfff, ¿${key} otra vez? Seguro que se te ocurre algo nuevo que enseñarme... 😉`);
        return;
    }

    urlMap[key] = url;
    await writeFileAsync(urlMapFilePath, JSON.stringify(urlMap), 'utf8');
    await message.channel.send(`${author} He aprendido un nuevo truco: ${key}. 😘`);
    await message.delete();
}

async function updateImgHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 3) {
        await message.channel.send(`${author} Háblame bien. #NoesNo`);
        return;
    }

    const url: string = parts[2].trim();
    if (!isWebUri(url)) {
        await message.channel.send(`${author} ¿Qué quieres que haga con esto? Dame una URL y te daré algo mejor a cambio... 🍑`);
        return;
    }

    const key: string = parts[1].trim();
    if (!urlMap[key]) {
        await message.channel.send(`${author} ¿Cómo quieres que cambie algo que no existe?`);
        return;
    }

    urlMap[key] = url;
    await writeFileAsync(urlMapFilePath, JSON.stringify(urlMap), 'utf8');
    await message.channel.send(`${author} Ok, he actualizado ${key}, pero aclárate en el futuro.`);
    await message.delete();
}

async function debugHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length < 2) {
        await message.channel.send(`${parts.length - 1} params received, at least 1 expected.`);
        return;
    }

    const param: string = parts[1].trim();
    switch (param) {
        case 'download-url-file':
            await message.channel.send(urlMapFilename, {
                files: [urlMapFilePath]
            });
            return;
        case 'download-conversation-file':
            await message.channel.send(conversationMapFilename, {
                files: [conversationMapFilePath]
            });
            return;
        case 'download-emoji-file':
            await message.channel.send(emojiMapFilename, {
                files: [emojiMapFilePath]
            });
            return;
        default:
            await message.channel.send(`Unknown command ${param}.`);
    }
}
