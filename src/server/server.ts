import { join as joinPath } from 'path';

import * as express from 'express';

const server: express.Express = express();

server.use(express.static(joinPath(__dirname, '..', '..', 'static')));

export default server;
