
type ContentStatus = "draft" | "scheduled" | "published" | "failed";

interface ContentItem {
  id: string;
  status: ContentStatus;
  // Other fields are irrelevant for this benchmark
}

function generateItems(count: number): ContentItem[] {
  const statuses: ContentStatus[] = ["draft", "scheduled", "published", "failed"];
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
}

function getStatsCurrent(items: ContentItem[]) {
  return {
    total: items.length,
    drafts: items.filter((i) => i.status === "draft").length,
    scheduled: items.filter((i) => i.status === "scheduled").length,
    published: items.filter((i) => i.status === "published").length,
    failed: items.filter((i) => i.status === "failed").length,
  };
}

function getStatsReduce(items: ContentItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.total++;
      if (item.status === "draft") acc.drafts++;
      else if (item.status === "scheduled") acc.scheduled++;
      else if (item.status === "published") acc.published++;
      else if (item.status === "failed") acc.failed++;
      return acc;
    },
    { total: 0, drafts: 0, scheduled: 0, published: 0, failed: 0 }
  );
}

function getStatsForOf(items: ContentItem[]) {
  const stats = {
    total: items.length,
    drafts: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
  };

  for (const item of items) {
    if (item.status === "draft") stats.drafts++;
    else if (item.status === "scheduled") stats.scheduled++;
    else if (item.status === "published") stats.published++;
    else if (item.status === "failed") stats.failed++;
  }
  return stats;
}

function getStatsForLoop(items: ContentItem[]) {
  const stats = {
    total: items.length,
    drafts: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.status === "draft") stats.drafts++;
    else if (item.status === "scheduled") stats.scheduled++;
    else if (item.status === "published") stats.published++;
    else if (item.status === "failed") stats.failed++;
  }
  return stats;
}

const ITEMS_COUNT = 100000;
const ITERATIONS = 100;

console.log(`Generating ${ITEMS_COUNT} items...`);
const items = generateItems(ITEMS_COUNT);

console.log(`Running benchmark (${ITERATIONS} iterations)...`);

function benchmark(name: string, fn: (items: ContentItem[]) => any) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn(items);
  }
  const end = performance.now();
  const avg = (end - start) / ITERATIONS;
  console.log(`${name}: ${avg.toFixed(4)} ms/op`);
}

// Warmup
getStatsCurrent(items.slice(0, 100));
getStatsReduce(items.slice(0, 100));
getStatsForOf(items.slice(0, 100));
getStatsForLoop(items.slice(0, 100));

benchmark("Current (Filter)", getStatsCurrent);
benchmark("Reduce", getStatsReduce);
benchmark("For..of", getStatsForOf);
benchmark("For Loop", getStatsForLoop);
