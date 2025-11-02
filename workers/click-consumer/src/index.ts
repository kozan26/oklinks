interface ClickEvent {
  alias: string;
  ts: number;
  ua: string | null;
  ref: string | null;
}

interface Env {
  DB: D1Database;
}

function formatDay(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default {
  async queue(batch: MessageBatch<ClickEvent>, env: Env): Promise<void> {
    // Group clicks by alias and day for batch processing
    const aggregates = new Map<string, Map<string, number>>();

    for (const message of batch.messages) {
      const { alias, ts } = message.body;
      const day = formatDay(ts);

      if (!aggregates.has(alias)) {
        aggregates.set(alias, new Map());
      }
      const aliasDays = aggregates.get(alias)!;
      aliasDays.set(day, (aliasDays.get(day) || 0) + 1);
    }

    // Process each alias in a transaction
    for (const [alias, days] of aggregates.entries()) {
      try {
        await env.DB.batch([
          // Update click_daily for each day
          ...Array.from(days.entries()).map(([day, count]) =>
            env.DB.prepare(
              `INSERT INTO click_daily (alias, day, count)
               VALUES (?, ?, ?)
               ON CONFLICT(alias, day) DO UPDATE SET count = count + ?`
            ).bind(alias, day, count, count)
          ),
          // Update total clicks for the alias
          env.DB.prepare(
            `UPDATE links SET clicks_total = clicks_total + ? WHERE alias = ?`
          ).bind(
            Array.from(days.values()).reduce((sum, count) => sum + count, 0),
            alias
          ),
        ]);

        console.log(`Processed ${days.size} day(s) for alias: ${alias}`);
      } catch (error) {
        console.error(`Error processing alias ${alias}:`, error);
        // Don't ack messages on error so they can be retried
        throw error;
      }
    }
  },
};

