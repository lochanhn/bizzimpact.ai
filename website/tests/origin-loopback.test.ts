import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireSameOrigin } from '../lib/server/http';

const req = (url: string, origin: string | null) => new Request(url, { method: 'POST', headers: origin ? { Origin: origin } : {} });

test('development accepts localhost and 127.0.0.1 as the same site, nothing else', () => {
  assert.doesNotThrow(() => requireSameOrigin(req('http://localhost:3000/api/plan', 'http://127.0.0.1:3000')));
  assert.doesNotThrow(() => requireSameOrigin(req('http://127.0.0.1:3000/api/plan', 'http://localhost:3000')));
  assert.throws(() => requireSameOrigin(req('http://localhost:3000/api/plan', 'http://127.0.0.1:4000')), /website/);
  assert.throws(() => requireSameOrigin(req('http://localhost:3000/api/plan', 'https://evil.com')), /website/);
  assert.throws(() => requireSameOrigin(req('http://localhost:3000/api/plan', null)), /website/);
});

test('production still requires the configured public HTTPS origin', () => {
  const env = process.env as Record<string, string | undefined>;
  const prev = { NODE_ENV: env.NODE_ENV, SITE_URL: env.SITE_URL };
  env.NODE_ENV = 'production'; env.SITE_URL = 'https://bizzimpact.example.com';
  try {
    assert.doesNotThrow(() => requireSameOrigin(req('http://internal:3000/api/plan', 'https://bizzimpact.example.com')));
    assert.throws(() => requireSameOrigin(req('http://localhost:3000/api/plan', 'http://localhost:3000')), /website/);
  } finally { env.NODE_ENV = prev.NODE_ENV; env.SITE_URL = prev.SITE_URL; }
});
