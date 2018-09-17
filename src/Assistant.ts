const { Compute } = require('google-auth-library');

class Assistant {
    async login() {
        this._client = new Compute({});
        const url = `https://embeddedassistant.googleapis.com/dns/v1/projects/${this._projectId}`;
        const res = await this._client.request({ url });
        console.log(res.data);
    }

    private _client: any;
    private _projectId: string = 'discord-bot';
}

const assistant = new Assistant();
assistant.login();

export { assistant };
