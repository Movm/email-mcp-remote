import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const registerPath = '/app/dist/tools/register.js';
const draftsPath = '/app/dist/tools/drafts.tool.js';

function replaceExactlyOnce(source, search, replacement, label) {
  const occurrences = source.split(search).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one ${label}; found ${occurrences}`);
  }
  return source.replace(search, replacement);
}

export function patchRegisterSource(source) {
  const healthRegistration = 'registerHealthTools(server, connections, imapService);';
  const writeToolsMarker = '    // Write tools — skipped in read-only mode\n';

  let patched = replaceExactlyOnce(
    source,
    healthRegistration,
    '// check_health disabled by deployment wrapper: upstream ImapFlow timeout can terminate the process.',
    'check_health registration',
  );

  patched = replaceExactlyOnce(
    patched,
    writeToolsMarker,
    [
      '    // Draft-only deployment mode: preserve upstream read-only protections while',
      '    // allowing the separately patched save_draft tool to append an unsent draft.',
      '    if (readOnly) {',
      '        registerDraftTools(server, imapService, smtpService);',
      '    }',
      writeToolsMarker.trimEnd(),
      '',
    ].join('\n'),
    'write-tools marker',
  );

  return patched;
}

export function patchDraftsSource(source) {
  const oldDescription =
    'Save an email draft to the Drafts folder. Compose over time, then use send_draft to send it. Use list_emails with the Drafts mailbox to see saved drafts.';
  const newDescription =
    'Save an unsent email draft to the Drafts folder for later review. This server cannot send drafts. Use list_emails with the Drafts mailbox to see saved drafts.';
  const sendDraftMarker = [
    '    // ---------------------------------------------------------------------------',
    '    // send_draft',
    '    // ---------------------------------------------------------------------------',
    '',
  ].join('\n');
  const sourceMapMarker = '\n}\n//# sourceMappingURL=drafts.tool.js.map';

  let patched = replaceExactlyOnce(
    source,
    oldDescription,
    newDescription,
    'save_draft description',
  );

  const sendDraftStart = patched.indexOf(sendDraftMarker);
  const functionEnd = patched.indexOf(sourceMapMarker);
  if (sendDraftStart === -1 || functionEnd === -1 || sendDraftStart >= functionEnd) {
    throw new Error('Unable to isolate send_draft registration in pinned upstream image');
  }

  patched = `${patched.slice(0, sendDraftStart)}${patched.slice(functionEnd)}`;
  if (patched.includes("'send_draft'") || patched.includes('smtpService.sendDraft')) {
    throw new Error('send_draft registration remains after patching');
  }

  return patched;
}

export function patchUpstream() {
  const registerSource = readFileSync(registerPath, 'utf8');
  const draftsSource = readFileSync(draftsPath, 'utf8');

  writeFileSync(registerPath, patchRegisterSource(registerSource));
  writeFileSync(draftsPath, patchDraftsSource(draftsSource));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  patchUpstream();
}
