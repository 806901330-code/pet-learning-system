import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = await createServer({
  configFile: path.resolve(__dirname, 'vite.config.ts'),
  server: { port: 5173, host: true },
});
await server.listen();
server.printUrls();
