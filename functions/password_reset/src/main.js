import { createApp } from "./startup/createApp.js";

export default async (ctx) => {
  const app = createApp({ log: ctx?.log, error: ctx?.error });
  return app(ctx);
};

