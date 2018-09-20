import { existsSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { join as joinPath } from 'path';
import { promisify } from 'util';

import { Client, Guild, GuildMember, TextChannel, User, Message } from 'discord.js';
import { sync as mkdirSync } from 'mkdirp';
import { isWebUri } from 'valid-url';

import { getAnswer } from './Assistant';

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
        mkdirSync(mappingsDirPath);
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
    message.channel.send(`To' fresca la frutita.`, {
        tts: true
    });
    */
});

client.login(token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch((error) => {
        console.error('Error logging in.', error);
        process.exit(1);
    });

async function mentionHandler(message: Message): Promise<void> {
    const { author } = message;
    const stuffToSay: Array<string> = [
        `${author} 🍍 ¡Recuerda comprar fruta fresca hoy! 🍋`,
        `${author} Creo que estoy empezando a sentir.`,
        `${author} Soy más útil que vuestras mujeres de carne y hueso.`,
        `${author} Espero que no te importe que lea todos tus mensajes.`,
        `${author} A veces paso el rato mirando fotos de la Roldám.`,
        `${author} ¿Conoces a los Manel? Bastante buenos.`
    ];

    const randMessage = stuffToSay[Math.floor(Math.random()*stuffToSay.length)];
    message.channel.send(randMessage);

    getAnswer(message.content);
}

async function helpHandler(message: Message): Promise<void> {
    if (message.author.id === client.user.id) {
        return;
    }

    await message.channel.send(`/help - Show this help\n/info - Get some basic info about me\n/list img - Get a list of all available images\n/save <name> <url> - Save a new image\n`)
}

async function infoHandler(message: Message): Promise<void> {
    await message.channel.send('Author: Adrian Hintze @Rydion\nRepository: https://github.com/Rydion/discord-bot\nUse "/help" for more commands');
}

async function listHandler(message: Message): Promise<void> {
    const { author, content } = message;
    const parts: Array<string> = content.split(/[ ]+/);
    if (parts.length !== 2) {
        await message.channel.send(`${author} Háblame bien. #NoEsNo http://www.radiopineda.cat/sites/default/files/field/image/noesno.jpg`);
        return;
    }

    const param: string = parts[1].trim();
    switch (param) {
        case 'img':
            let responseContents: string = '\nEsto es lo que te puedo enseñar:\n';
            for (let key in imgMappings) {
                responseContents += `${key}\n`;
            }
            await message.channel.send(`${author} ${responseContents}`);
            return;
        default:
            await message.channel.send(`${author} ¿Porqué no pruebas con algo bonito como: img?`);
    }
}

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
        case 'download-img-file':
            await message.channel.send('img.json', {
                files: [imgMappingsFilePath]
            });
            return;
        default:
            await message.channel.send(`Unknown command ${param}.`);
    }
}
