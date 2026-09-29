import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const workerPath = 'worker/src/index.ts';
const remotePath = 'src/lib/portfolio-remote-assistant.ts';
const chatPath = 'src/components/sections/portfolio-chat.tsx';

const [workerSource, remoteSource, chatSource] = await Promise.all([
  readFile(workerPath, 'utf8'),
  readFile(remotePath, 'utf8'),
  readFile(chatPath, 'utf8'),
]);

for (const forbidden of [
  'profileSummaryAnswer',
  'siteOverviewAnswer',
  'conversationReply',
  'PORTFOLIO_SCOPE_REPLY',
  'runtimePrivacyAnswer',
  'Immediate conversational response.',
  'Unsupported personal detail declined.',
]) {
  assert.equal(
    workerSource.includes(forbidden) || remoteSource.includes(forbidden),
    false,
    `canned answer path still present: ${forbidden}`,
  );
}

for (const required of [
  'streamAuditedAnswer',
  'llmGeneratedResponses: true',
  'groundingAudit: true',
  "responseFormat: 'stream'",
  'stream: false',
  'stream: true',
  "'Content-Type': 'text/event-stream; charset=utf-8'",
]) {
  assert.equal(workerSource.includes(required), true, `missing worker safeguard: ${required}`);
}

const compiled = ts.transpileModule(workerSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;

const tempFile = '.tmp-portfolio-ai-policy-test.mjs';
await writeFile(tempFile, compiled, 'utf8');
const moduleUrl = pathToFileURL(process.cwd() + '/' + tempFile).href + '?t=' + Date.now();
const workerModule = await import(moduleUrl);
await unlink(tempFile).catch(() => {});

const classify = workerModule.classifyRequestScope;
assert.equal(typeof classify, 'function');

const cases = [
  ['Tell me about Vidit', 'portfolio'],
  ['Who is Vidit Shah?', 'portfolio'],
  ['Show me the website sections', 'portfolio'],
  ['What projects has he built?', 'portfolio'],
  ['What has he built?', 'portfolio'],
  ['What are his skills?', 'portfolio'],
  ["What's Vidit's CGPA?", 'portfolio'],
  ['Explain RAG', 'technical'],
  ['How does ROS2 work?', 'technical'],
  ['What is React?', 'technical'],
  ['Hi', 'conversation'],
  ['Thanks', 'conversation'],
  ['Who are you?', 'conversation'],
  ['How to make an eggless cake at home?', 'out-of-scope'],
  ['Tell me something about Modi', 'out-of-scope'],
  ['Recommend a movie', 'out-of-scope'],
];

for (const [question, expected] of cases) {
  const actual = classify(question);
  assert.equal(actual, expected, `${question} -> ${actual}, expected ${expected}`);
}

for (const expectedPrompt of [
  '🚀 What has he built?',
  '💻 What are his skills?',
  '🔗 Open his GitHub',
  '🔗 Open his LinkedIn',
]) {
  assert.equal(chatSource.includes(expectedPrompt), true, `missing visitor-facing prompt: ${expectedPrompt}`);
}

for (const forbiddenPrompt of [
  '🚀 What have I built?',
  '💻 What are my skills?',
  '🔗 Open my GitHub',
  '🔗 Open my LinkedIn',
]) {
  assert.equal(chatSource.includes(forbiddenPrompt), false, `first-person visitor prompt still present: ${forbiddenPrompt}`);
}

assert.equal(remoteSource.includes('emitProgressiveTokens'), true, 'non-stream compatibility token reveal missing');
assert.equal(remoteSource.includes("response.headers.get('X-Portfolio-Mode')"), true, 'stream mode metadata handling missing');

console.log(`Portfolio AI policy regression suite passed (${cases.length} intent cases + architecture assertions).`);
