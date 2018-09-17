import { existsSync, readFileSync } from 'fs';
import { join as joinPath } from 'path';

const { Compute } = require('google-auth-library');

const confFilePath = joinPath(__dirname, '..', 'conf', 'conf.json');
if (!existsSync(confFilePath)) {
    console.error('Conf file does not exist.');
    process.exit(1);
}

const conf = JSON.parse(readFileSync(confFilePath, 'utf8'));

class Assistant {
    constructor(
        private _projectId: string
    ) {

    }

    async login() {
        this._client = new Compute({});
        const url = `https://embeddedassistant.googleapis.com`;
        const res = await this._client.request({ url });
        console.log(res);
    }

    test() {
        return Math.random();
    }

    private _client: any;
}

const assistant = new Assistant(conf.projectId);
assistant.login();

export { assistant };
