import { readFileSync, writeFileSync } from 'node:fs';

const path = '/app/dist/tools/register.js';
const source = readFileSync(path, 'utf8');
const registration = 'registerHealthTools(server, connections, imapService);';

if (!source.includes(registration)) {
  throw new Error('Unable to locate check_health registration in pinned upstream image');
}

writeFileSync(
  path,
  source.replace(
    registration,
    '// check_health disabled by deployment wrapper: upstream ImapFlow timeout can terminate the process.',
  ),
);
