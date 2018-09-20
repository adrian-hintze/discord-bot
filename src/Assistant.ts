import * as path from 'path';

const GoogleAssistant: any = require('google-assistant');

const assistant = new GoogleAssistant({
    keyFilePath: path.join(__dirname, '..', 'conf', 'auth.json'),
    savedTokensPath: path.join(__dirname, '..', 'tokens', 'tokens.json'),
});

function startConversation(conversation: any) {
    conversation
        .on('response', (text: string) => {
            console.log('Assistant Response:', text);
            conversation.end();
        })
        .on('ended', (error: any, continueConversation: any) => {
            if (error) {
                console.log('Conversation Ended Error:', error);
            }
            else {
                console.log('Conversation Complete');
                conversation.end();
            }
        })
        .on('error', (error: Error) => {
            console.log('Conversation Error:', error);
        });
};

export function getAnswer(query: string) {
    assistant.start({
        lang: 'es-ES',
        textQuery: query,
        screen: {
            isOn: true
        }
    }, startConversation);
}
