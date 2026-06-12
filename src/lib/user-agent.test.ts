import { describe, expect, test } from "bun:test";

describe("mapAgentNameToCallerSlug", () => {
  test("maps claude to claude-code", async () => {
    const { mapAgentNameToCallerSlug } = await import("./user-agent");
    expect(mapAgentNameToCallerSlug("claude")).toBe("claude-code");
  });

  test("strips @version from AI_AGENT-style names", async () => {
    const { mapAgentNameToCallerSlug } = await import("./user-agent");
    expect(mapAgentNameToCallerSlug("devin@1")).toBe("devin");
  });

  test("passes through known agent names", async () => {
    const { mapAgentNameToCallerSlug } = await import("./user-agent");
    expect(mapAgentNameToCallerSlug("cursor")).toBe("cursor");
  });
});

describe("buildObserveCliUserAgent", () => {
  test("base UA without caller", async () => {
    const { buildObserveCliUserAgent } = await import("./user-agent");
    const { CURRENT_CLI_VERSION } = await import("./constants");
    expect(buildObserveCliUserAgent()).toBe(
      `observe-cli-ts/${CURRENT_CLI_VERSION}`,
    );
  });

  test("appends caller token when provided", async () => {
    const { buildObserveCliUserAgent } = await import("./user-agent");
    const { CURRENT_CLI_VERSION } = await import("./constants");
    expect(buildObserveCliUserAgent("claude-code")).toBe(
      `observe-cli-ts/${CURRENT_CLI_VERSION} caller/claude-code`,
    );
  });
});

describe("detectCaller", () => {
  test("returns mapped slug when determineAgent reports an agent", async () => {
    const { detectCaller } = await import("./user-agent");
    const caller = await detectCaller({
      determineAgent: async () => ({
        isAgent: true,
        agent: { name: "claude" },
      }),
    });
    expect(caller).toBe("claude-code");
  });

  test("returns undefined when not an agent", async () => {
    const { detectCaller } = await import("./user-agent");
    const caller = await detectCaller({
      determineAgent: async () => ({ isAgent: false, agent: undefined }),
    });
    expect(caller).toBeUndefined();
  });
});

describe("initUserAgent", () => {
  test("sets OBSERVE_CLI_USER_AGENT from injected determineAgent", async () => {
    const userAgent = await import("./user-agent");
    const { CURRENT_CLI_VERSION } = await import("./constants");

    await userAgent.initUserAgent({
      determineAgent: async () => ({
        isAgent: true,
        agent: { name: "cursor" },
      }),
    });

    expect(userAgent.OBSERVE_CLI_USER_AGENT).toBe(
      `observe-cli-ts/${CURRENT_CLI_VERSION} caller/cursor`,
    );
  });
});
