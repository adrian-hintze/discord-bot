import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
import { promisify } from 'util';

import { Client, Guild, GuildMember, TextChannel, User, Message } from 'discord.js';
import { sync as mkdirSync } from 'mkdirp';
import { isWebUri } from 'valid-url';

import { appConfService, DiscordConf } from './services/app-conf.service';

interface Mapping {
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

// URL mapping file
const urlMapFilename: string = 'url.json';
const urlMapFilePath = joinPath(mapsDirPath, urlMapFilename);
try {
    if (!existsSync(urlMapFilePath)) {
        writeFileSync(urlMapFilePath, JSON.stringify({}), 'utf8');
    }
}
catch (error) {
    console.error('I/O error img mappings file.', error);
    process.exit(1);
}
const urlMap: Mapping = JSON.parse(readFileSync(urlMapFilePath, 'utf8'));

// Conversation mapping file
const conversationMapFilename: string = 'conversation.json';
const conversationMapFilePath = joinPath(mapsDirPath, 'conversation.json');
try {
    if (!existsSync(conversationMapFilePath)) {
        writeFileSync(conversationMapFilePath, JSON.stringify([]), 'utf8');
    }
}
catch (error) {
    console.error('I/O error conversation mappings file.', error);
    process.exit(1);
}
const conversationMap: Array<string> = JSON.parse(readFileSync(conversationMapFilePath, 'utf8'));


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
                await message.channel.send(`${author} ${url}`);
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

async function helpHandler(message: Message): Promise<void> {
    if (message.author.id === client.user.id) {
        return;
    }

    await message.channel.send(`${message.author}\n/help - Show this help\n/info - Get some basic info about me\n/list - Get a list of all available urls\n/save <name> <url> - Save a new url\n/update <name> <url> - Update an existing url\n/delete <name> - Delete an existing url\n`)
    await message.delete();
}

async function infoHandler(message: Message): Promise<void> {
    await message.channel.send('Author: Adrian Hintze @Rydion\nRepository: https://github.com/Rydion/discord-bot\nUse "/help" for more commands');
}

async function listHandler(message: Message): Promise<void> {
    const keys: Array<string> = [];
    for (let key in urlMap) {
        keys.push(key);
    }

    keys.sort((a, b) => a < b ? -1 : 1);

    let responseContent: string = '\nEsto es lo que te puedo enseñar:';
    keys.forEach(key => responseContent += `\n${key}`);

    await message.channel.send(`${message.author} ${responseContent}`);
    await message.delete();
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
        default:
            await message.channel.send(`Unknown command ${param}.`);
    }
}
