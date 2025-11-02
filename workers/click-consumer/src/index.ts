interface Env {
  DB: D1Database;
}

interface ClickEvent {
  alias: string;
  ts: number;
}

function formatDay(timestamp: number): string {
  const ms = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export default {
  async queue(batch: MessageBatch<ClickEvent>, env: Env): Promise<void> {
    const aggregates = new Map<string, { alias: string; day: string; count: number }>();
    const totals = new Map<string, number>();
    const pendingAck: Message<ClickEvent>[] = [];

    for (const message of batch.messages) {
      const body = message.body;
      if (!body?.alias) {
        message.ack();
        continue;
      }
      const ts = typeof body.ts === "number" ? body.ts : Date.now();
      const alias = String(body.alias);
      const day = formatDay(ts);
      const key = `${alias}:${day}`;
      const existing = aggregates.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        aggregates.set(key, { alias, day, count: 1 });
      }
      totals.set(alias, (totals.get(alias) ?? 0) + 1);
      pendingAck.push(message);
    }

    if (aggregates.size === 0 && totals.size === 0) {
      return;
    }

    const statements: D1PreparedStatement[] = [];

    for (const entry of aggregates.values()) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO click_daily (alias, day, count)
           VALUES (?, ?, ?)
           ON CONFLICT(alias, day) DO UPDATE SET count = count + excluded.count`,
        ).bind(entry.alias, entry.day, entry.count),
      );
    }

    for (const [alias, count] of totals.entries()) {
      statements.push(
        env.DB.prepare(
          "UPDATE links SET clicks_total = clicks_total + ? WHERE alias = ?",
        ).bind(count, alias),
      );
    }

    if (statements.length === 0) {
      return;
    }

    try {
      await env.DB.batch(statements);
      console.log(
        `Processed ${aggregates.size} daily buckets across ${totals.size} aliases`,
      );
      for (const message of pendingAck) {
        message.ack();
      }
    } catch (error) {
      console.error("Failed to persist click aggregates", error);
      throw error;
    }
  },
};
