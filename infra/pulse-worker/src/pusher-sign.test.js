import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  md5Hex,
  buildPusherTriggerRequest,
  authorizePulse,
  corsHeaders,
} from "./pusher-sign.js";

describe("md5Hex", () => {
  it("matches known vector empty", () => {
    assert.equal(md5Hex(""), "d41d8cd98f00b204e9800998ecf8427e");
  });
  it("matches known vector 'hello'", () => {
    assert.equal(md5Hex("hello"), "5d41402abc4b2a76b9719d911017c592");
  });
});

describe("buildPusherTriggerRequest", () => {
  it("builds url with signature and body_md5", async () => {
    const { url, body, bodyMd5, path, query } = await buildPusherTriggerRequest({
      appId: "123456",
      key: "appkey",
      secret: "appsecret",
      cluster: "mt1",
      channel: "sale-updates",
      event: "sale:created",
      data: { saleId: "s1" },
      timestampSec: 1700000000,
    });
    assert.equal(path, "/apps/123456/events");
    assert.ok(query.includes("auth_key=appkey"));
    assert.ok(query.includes("auth_timestamp=1700000000"));
    assert.ok(query.includes(`body_md5=${bodyMd5}`));
    assert.ok(url.startsWith("https://api-mt1.pusher.com/apps/123456/events?"));
    assert.ok(url.includes("auth_signature="));
    const parsed = JSON.parse(body);
    assert.equal(parsed.name, "sale:created");
    assert.equal(parsed.channel, "sale-updates");
    assert.equal(JSON.parse(parsed.data).saleId, "s1");
  });

  it("is deterministic for same timestamp", async () => {
    const a = await buildPusherTriggerRequest({
      appId: "1",
      key: "k",
      secret: "s",
      cluster: "mt1",
      channel: "c",
      event: "e",
      data: {},
      timestampSec: 42,
    });
    const b = await buildPusherTriggerRequest({
      appId: "1",
      key: "k",
      secret: "s",
      cluster: "mt1",
      channel: "c",
      event: "e",
      data: {},
      timestampSec: 42,
    });
    assert.equal(a.url, b.url);
    assert.equal(a.body, b.body);
  });
});

describe("authorizePulse", () => {
  const key = "test-pulse-key";
  it("accepts Bearer", () => {
    const req = new Request("https://x/pulse/event", {
      headers: { Authorization: `Bearer ${key}` },
    });
    assert.equal(authorizePulse(req, key), true);
  });
  it("accepts X-Api-Key", () => {
    const req = new Request("https://x/pulse/event", {
      headers: { "X-Api-Key": key },
    });
    assert.equal(authorizePulse(req, key), true);
  });
  it("rejects wrong key", () => {
    const req = new Request("https://x/pulse/event", {
      headers: { Authorization: "Bearer other" },
    });
    assert.equal(authorizePulse(req, key), false);
  });
  it("rejects missing", () => {
    const req = new Request("https://x/pulse/event");
    assert.equal(authorizePulse(req, key), false);
  });
});

describe("corsHeaders", () => {
  it("echoes allowed origin", () => {
    const h = corsHeaders("http://localhost:5174", "http://localhost:5173,http://localhost:5174");
    assert.equal(h["Access-Control-Allow-Origin"], "http://localhost:5174");
  });
});
