import { actions, Figranium, FigraniumError, variable, type Task } from "@figranium/sdk";

const client = new Figranium({
  ...(process.env.FIGRANIUM_BASE_URL ? { baseUrl: process.env.FIGRANIUM_BASE_URL } : {}),
  apiKey: process.env.FIGRANIUM_API_KEY ?? "",
});

const task: Task = {
  name: "Example search",
  description: "Searches a page and extracts its visible content",
  url: "https://example.com",
  mode: "agent",
  variables: { query: { type: "string", value: "figranium" } },
  actions: [
    actions.waitFor("body"),
    actions.set("activeQuery", variable("query")),
    actions.getContent("body", "pageText"),
  ],
};

try {
  const saved = await client.tasks.save(task);
  const result = await client.runTask(saved.id!, { variables: { query: "browser automation" } });
  console.log(result.data);
} catch (error) {
  if (error instanceof FigraniumError) {
    console.error(error.status, error.code, error.message);
  } else {
    throw error;
  }
}
