export const json = (ctx, statusCode, payload) => {
  ctx.res
    .json(payload, statusCode, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    })
    .send();
};

