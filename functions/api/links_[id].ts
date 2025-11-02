import {
  deleteLink as deleteLinkRecord,
  getLinkById,
} from "../_lib/link-service";
import { aliasCacheKey, json } from "../_lib/utils";
import type { Env } from "../_lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "missing_id" }, 400);
  }

  const record = await getLinkById(env, id);
  return json(record ?? null);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "missing_id" }, 400);
  }

  const record = await getLinkById(env, id);
  const success = await deleteLinkRecord(env, id);
  if (record) {
    await env.CACHE.delete(aliasCacheKey(record.alias));
  }
  return json({ deleted: success });
};
