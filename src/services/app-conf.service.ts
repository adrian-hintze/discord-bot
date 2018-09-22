import { join } from 'path';

export interface DiscordConf {
    token: string;
}

class AppConfService {
    static fromConfigurationFile(conf: any): AppConfService {
        const {
            discord: discordConf
        } = conf;

        // DiscordConf
        if (!discordConf) {
            throw new Error('Discord configuration missing in file.');
        }

        const {
            token
        } = <DiscordConf>discordConf;

        if (!token) {
            throw new Error('DB configuration is missing parameters. The following need to exist: token.');
        }

        return new AppConfService(discordConf);
    }

    get discordConf(): DiscordConf {
        return this._discordConf;
    }

    private constructor(
        private _discordConf: DiscordConf
    ) {

    }
}

try {
    require(join('..', 'conf', 'conf.json')); 
}
catch (error) {
    console.error('Error reading conf file.', error);
    process.exit(1);
}

const confFileName = 'conf.json';
const confFilePath = join('..', 'conf', confFileName);
const confFileContents = require(confFilePath); 
export const appConfService: AppConfService = AppConfService.fromConfigurationFile(confFileContents);
