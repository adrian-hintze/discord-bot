import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { extname, join as joinPath } from 'path';
import { resolve as resolveUrl } from 'url';
import { promisify } from 'util';

import { sync as mkdirSync } from 'mkdirp';
import { isWebUri } from 'valid-url';
import {
    Client,
    Collection,
    Emoji,
    Guild,
    Message,
    User
} from 'discord.js';

import { appConfService, DiscordConf, ServerConf } from '../services/app-conf.service';

const imageDownloader: any = require('image-downloader');

interface MapFile {
    [key: string]: string
}

const writeFileAsync = promisify(writeFile);
const serverConf: ServerConf = appConfService.serverConf;
const discordConf: DiscordConf = appConfService.discordConf;

// Static files
const staticDirname: string = 'static';
const staticFilesDirPath: string = joinPath(__dirname, '..', '..', staticDirname);
try {
    if (!existsSync(staticFilesDirPath)) {
        mkdirSync(staticFilesDirPath);
        mkdirSync(joinPath(staticFilesDirPath, 'emoji'));
    }
}
catch (error) {
    console.error('I/O error static dir.', error);
    process.exit(1);
}

// Mappings dir
const mapsDirname: string = 'maps';
const mapsDirPath = joinPath(__dirname, '..', '..', mapsDirname);
try {
    if (!existsSync(mapsDirPath)) {
        mkdirSync(mapsDirPath);
    }
}
catch (error) {
    console.error('I/O error mappings dir.', error);
    process.exit(1);
}

function getMappingFileContentsSync(path: string, defaultContents: any): MapFile | Array<string> {
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
const bot: Client = new Client();

bot.on('ready', () => {
    console.log('My body is ready!');

    /*
    const channel: TextChannel = <TextChannel>guild.channels.get(id);
    if (!channel) {
        return;
    }
    */
});

// Emojis
/*
async function emojiCreateHandler(emoji: Emoji) {
    try {
        await saveEmoji(emoji);
        const createEmojiPromises = bot.guilds.map(async (guild) => {
            const { name } = emoji;
            try {
                await guild.createEmoji(name, emojiMap[name]);
            }
            catch (e) {

            }
        });
        await Promise.all(createEmojiPromises);
    }
    catch (e) {
        console.error('Something happened.', e);
    }
}

async function emojiDeleteHandler(emoji: Emoji) {
    try {
        const { name } = emoji;
        delete emojiMap[name]; // TODO delete image from disk?
        const deleteEmojiPromises = bot.guilds.map(async (guild) => {
            try {
                await guild.deleteEmoji(name);
            }
            catch (e) {

            }
        });
        await Promise.all(deleteEmojiPromises);
    }
    catch (e) {
        console.error('Something happened.', e);
    }
}

// Apparently the callbacks don't work
bot.on('emojiCreate', emojiCreateHandler);
bot.on('emojiDelete', emojiDeleteHandler);
bot.on('emojiUpdate', async (oldEmoji, newEmoji) => {
    try {
        await emojiDeleteHandler(oldEmoji);
        await emojiCreateHandler(newEmoji);
    }
    catch (e) {
        console.error('Something happened.', e);
    }
});
*/

// Messages
bot.on('message', async (message: Message) => {
    const content: string = message.content;

    const mentionsCortana: boolean = !!message.mentions.users.get(bot.user.id);
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

                await message.channel.send(`${author} - ${url}`);
                /*
                await message.channel.send(`${author} - ${key}`, {
                    embed: {
                        image: {
                            url
                        }
                    }
                });
                */
                await message.delete();
            }
            return;
        }
    }
    catch (error) {
        console.error('Something happened.', error);
    }
});

function saveEmoji(emoji: Emoji): Promise<void> {
    const { name, url } = emoji;
    const imgName: string = `${name}${extname(url)}`;
    let localUrl: string = resolveUrl(serverConf.domain, '/emoji/');
    localUrl = resolveUrl(localUrl, imgName);

    emojiMap[name] = localUrl;

    return imageDownloader.image({
        url,
        dest: joinPath(staticFilesDirPath, 'emoji', imgName)
    });
}

async function mentionHandler(message: Message): Promise<void> {
    if (!conversationMap.length) {
        return;
    }

    const { author } = message;
    const randMessage = conversationMap[Math.floor(Math.random() * conversationMap.length)];
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

            const downloadPromises: Array<Promise<void>> = emojis.map(e => saveEmoji(e));
            await Promise.all(downloadPromises);

            await writeFileAsync(emojiMapFilePath, JSON.stringify(emojiMap), 'utf8');
            await message.channel.send(`${message.author} Emojis memorizados.`);
            await message.delete();
            return;
        case 'sync':
            console.log('Syncing emojis');
            const failGuilds: Array<string> = [];
            const promises: Array<Promise<void>> = bot.guilds.map(async (guild) => {
                console.log(`Syncing emojis for guild ${guild.name}`);
                try {
                    const emojis: Collection<string, Emoji> = guild.emojis;
                    const deleteEmojiPromises: Array<Promise<void>> = emojis.map(e => guild.deleteEmoji(e));
                    await Promise.all(deleteEmojiPromises);
                    console.log(`Deleted emojis for guild ${guild.name}`);

                    const createEmojiPromises: Array<Promise<Emoji>> = Object.entries(emojiMap).map((entry) => {
                        const [key, value] = entry;
                        return guild.createEmoji(value, key);
                    });
                    await Promise.all(createEmojiPromises);
                    console.log(`Created emojis for guild ${guild.name}`);
                }
                catch (e) {
                    console.error(`Error syncing guild: ${guild.name}.`);
                    failGuilds.push(guild.name);
                }
            });
            await Promise.all(promises);

            if (failGuilds.length) {
                await message.channel.send(`${message.author} No he podido sincronizar: ${failGuilds.join(', ')}.`);
            }

            const nono: Emoji = message.guild.emojis.find(e => e.name === 'nono');
            if (!nono) {
                return;
            }

            await message.channel.send(`${message.author} Si se han perdido todos los emoji no es mi culpa. ${nono.toString()}`);
            await message.delete();
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
    if (message.author.id === bot.user.id) {
        return;
    }

    const helpMessage: Array<string> = [
        '',
        `Add me to a server: <${discordConf.joinUrl}>`,
        '',
        '/help - Show this help',
        '',
        '/emoji sync - Sync local emojis to every server',
        '/info - Get some basic info about me',
        '/list <param> - Get a list of all available elements: url, emoji-sync, emoji-server',
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
        case 'emoji-sync':
            Object.entries(emojiMap).forEach((entry) => {
                const [key, value] = entry;
                names.push(`${key} - <${value}>`);
            });

            names.sort((a, b) => a < b ? -1 : 1);

            responseContent += 'Estos son los emoji disponibles para sincronizar:';
            responseContent += names.join('\n');

            await message.channel.send(`${message.author} ${responseContent}`);
            await message.delete();
            return;
        case 'emoji-server':
            const guild: Guild = message.guild;
            if (!guild) {
                return;
            }

            const emojis: Collection<string, Emoji> = guild.emojis;
            emojis.forEach(e => names.push(`${e.name} - ${e.toString()}`));

            names.sort((a, b) => a < b ? -1 : 1);

            responseContent += 'Estos son los emoji disponibles en el servidor:';
            responseContent += names.join('\n');

            await message.channel.send(`${message.author} ${responseContent}`);
            await message.delete();
            return;
        default:
            await message.channel.send(`${author} Porque no pruebas con: url, emoji-sync, emoji-server.`);
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

export default bot;
