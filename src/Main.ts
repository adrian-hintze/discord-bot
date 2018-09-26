import { appConfService, DiscordConf, ServerConf } from './services/app-conf.service';
import bot from './bot/bot';
import server from './server/server';

const discordConf: DiscordConf = appConfService.discordConf;
bot.login(discordConf.token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch((error) => {
        console.error('Error logging in.', error);
        process.exit(1);
    });

const serverConf: ServerConf = appConfService.serverConf;
server.listen(serverConf.port, () => console.log(`Server listening on port ${serverConf.port}.`));
