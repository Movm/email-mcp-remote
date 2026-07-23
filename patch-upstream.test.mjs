import assert from 'node:assert/strict';
import test from 'node:test';

import { patchDraftsSource, patchRegisterSource } from './patch-upstream.mjs';

test('read-only mode registers only the patched draft tool group', () => {
  const source = [
    'registerHealthTools(server, connections, imapService);',
    '    // Write tools — skipped in read-only mode',
    '    if (!readOnly) {',
    '        registerSendTools(server, smtpService);',
    '    }',
  ].join('\n');

  const patched = patchRegisterSource(source);

  assert.doesNotMatch(patched, /registerHealthTools\(/);
  assert.match(patched, /if \(readOnly\) \{\n        registerDraftTools/);
  assert.match(patched, /if \(!readOnly\)/);
});

test('draft patch keeps save_draft and removes send_draft', () => {
  const source = [
    'export default function registerDraftTools(server, imapService, smtpService) {',
    "    server.tool('save_draft', 'Save an email draft to the Drafts folder. Compose over time, then use send_draft to send it. Use list_emails with the Drafts mailbox to see saved drafts.');",
    '    // ---------------------------------------------------------------------------',
    '    // send_draft',
    '    // ---------------------------------------------------------------------------',
    "    server.tool('send_draft', async () => smtpService.sendDraft());",
    '}',
    '//# sourceMappingURL=drafts.tool.js.map',
  ].join('\n');

  const patched = patchDraftsSource(source);

  assert.match(patched, /server\.tool\('save_draft'/);
  assert.match(patched, /This server cannot send drafts/);
  assert.doesNotMatch(patched, /'send_draft'/);
  assert.doesNotMatch(patched, /smtpService\.sendDraft/);
});

test('patch fails closed if the pinned upstream layout changes', () => {
  assert.throws(() => patchRegisterSource('unexpected source'), /found 0/);
  assert.throws(() => patchDraftsSource('unexpected source'), /found 0/);
});
