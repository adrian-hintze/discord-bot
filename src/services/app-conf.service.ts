import { join } from 'path';

export interface DiscordConf {
    token: string;
    joinUrl: string;
}

export interface ServerConf {
    domain: string;
    port: number;
}

class AppConfService {
    static fromConfigurationFile(conf: any): AppConfService {
        const {
            discord: discordConf,
            server: serverConf
        } = conf;

        // DiscordConf
        if (!discordConf) {
            throw new Error('Discord configuration missing in file.');
        }

        const {
            token,
            joinUrl
        } = <DiscordConf>discordConf;

        if (!token || !joinUrl) {
            throw new Error('Discord configuration is missing parameters. The following need to exist: token, joinUrl.');
        }

        // ServerConf
        if (!serverConf) {
            throw new Error('Discord configuration missing in file.');
        }

        const {
            domain,
            port
        } = <ServerConf>serverConf;

        if (!domain || !port) {
            throw new Error('Server configuration is missing parameters. The following need to exist: domain, port.');
        }

        return new AppConfService(discordConf, serverConf);
    }

    get discordConf(): DiscordConf {
        return this._discordConf;
    }

    get serverConf(): ServerConf {
        return this._serverConf;
    }

    private constructor(
        private _discordConf: DiscordConf,
        private _serverConf: ServerConf
    ) {

    }
}

const confFilePath: string = join('..', '..', 'conf', 'conf.json');
try {
    require(confFilePath);
}
catch (error) {
    console.error('Error reading conf file.', error);
    process.exit(1);
}

const confFileName = 'conf.json';
const confFileContents = require(confFilePath); 
export const appConfService: AppConfService = AppConfService.fromConfigurationFile(confFileContents);
