import * as path from 'path';
import { ClientManager } from 'discord.js';

const GoogleAssistant: any = require('google-assistant');

const assistant = new GoogleAssistant({
    keyFilePath: path.join(__dirname, '..', 'conf', 'auth.json'),
    savedTokensPath: path.join(__dirname, '..', 'tokens', 'tokens.json'),
});

assistant
    .on('ready', () => console.log('Assistant ready.'))
    .on('error', (error: Error) => { console.log('Assistant Error.', error); });

function startConversation(conversation: any) {
    conversation
        .on('response', (text: string) => {
            console.log('Assistant Response:', text);
        })
        .on('ended', (error: any, continueConversation: any) => {
            if (error) {
                console.log('Conversation Ended Error:', error);
            }
            else {
                console.log('Conversation Complete');
            }
            conversation.end();
        })
        .on('error', (error: Error) => {
            console.log('Conversation Error:', error);
        });
};

export function getAnswer(query: string) {
    console.log(query.substring(22)); // remove mention, this needs to be done before`passing the query
    assistant.start({
        lang: 'es-ES',
        textQuery: query.substring(22),
        isNew: true
    }, startConversation);
}
