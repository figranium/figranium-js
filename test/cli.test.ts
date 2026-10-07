import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli";

describe("CLI argument parsing", () => {
  it("reads CI configuration and typed variables", () => {
    const result = parseArgs(
      ["run", "task-123", "--var", "url=https://example.com", "--var", "retries=3", "--var", "enabled=true"],
      { FIGRANIUM_URL: "https://figranium.example", FIGRANIUM_API_KEY: "secret" },
    );
    expect(result).toEqual({
      taskId: "task-123",
      baseUrl: "https://figranium.example",
      apiKey: "secret",
      variables: { url: "https://example.com", retries: 3, enabled: true },
      json: false,
    });
  });

  it("requires an API key", () => {
    expect(() => parseArgs(["run", "task-123"], {})).toThrow(/API key/);
  });

  it("rejects malformed variables", () => {
    expect(() => parseArgs(["run", "task-123", "--var", "broken"], { FIGRANIUM_API_KEY: "secret" })).toThrow(/name=value/);
  });
});
