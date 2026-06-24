import { describe, expect, test } from "bun:test";
import {
  parseDuration,
  getFleetTimeRange,
  runFleetQuery,
  FLEET_DATASET_PATH,
} from "./run-query";

describe("parseDuration", () => {
  test("parses single-unit Go durations", () => {
    expect(parseDuration("20m")).toBe(20 * 60_000);
    expect(parseDuration("24h")).toBe(24 * 3_600_000);
    expect(parseDuration("168h")).toBe(168 * 3_600_000);
    expect(parseDuration("90s")).toBe(90 * 1_000);
  });

  test("parses compound durations", () => {
    expect(parseDuration("1h30m")).toBe(3_600_000 + 30 * 60_000);
  });

  test("parses fractional durations", () => {
    expect(parseDuration("1.5h")).toBe(1.5 * 3_600_000);
  });

  test("rejects invalid input", () => {
    expect(() => parseDuration("")).toThrow();
    expect(() => parseDuration("abc")).toThrow();
    expect(() => parseDuration("10")).toThrow();
    expect(() => parseDuration("10x")).toThrow();
  });
});

describe("getFleetTimeRange", () => {
  test("end is now-15s truncated to the minute; start is end-window", () => {
    // 2026-06-24T12:00:40Z -> minus 15s = 12:00:25 -> truncate to 12:00:00
    const now = new Date("2026-06-24T12:00:40.000Z");
    const { startTime, endTime } = getFleetTimeRange("20m", now);
    expect(endTime).toBe("2026-06-24T12:00:00.000Z");
    expect(startTime).toBe("2026-06-24T11:40:00.000Z");
  });

  test("a window under 15s after truncation can land in the prior minute", () => {
    // 2026-06-24T12:00:10Z -> minus 15s = 11:59:55 -> truncate to 11:59:00
    const now = new Date("2026-06-24T12:00:10.000Z");
    const { endTime } = getFleetTimeRange("24h", now);
    expect(endTime).toBe("2026-06-24T11:59:00.000Z");
  });
});

describe("runFleetQuery", () => {
  function makeDataResult() {
    return [
      {
        queryId: "q1",
        stageId: "query",
        resultKind: "ResultKindData",
        paginatedResults: {
          columns: [
            ["2026-06-24T12:00:00Z", "2026-06-24T11:00:00Z"],
            ["host-a", "host-b"],
          ],
        },
        resultSchema: {
          fieldList: [
            { name: "valid_from", type: { tag: "Timestamp" } },
            { name: "host", type: { tag: "String" } },
          ],
        },
        errors: null,
      },
    ];
  }

  test("sends a datasetPath input and parses column-major rows in order", async () => {
    let captured: unknown;
    const datasetQueryOutput = (args: unknown) => {
      captured = args;
      return Promise.resolve(makeDataResult() as never);
    };

    const result = await runFleetQuery(
      {
        config: { customerId: "c", domain: "d", token: "t" },
        pipeline: "filter true",
        window: "20m",
      },
      { datasetQueryOutput: datasetQueryOutput as never },
    );

    const vars = (captured as { variables: { query: { inputs: unknown[] }[] } })
      .variables;
    expect(vars.query[0]?.inputs[0]).toEqual({
      inputName: "_",
      datasetPath: FLEET_DATASET_PATH,
    });

    expect(result.headers).toEqual(["valid_from", "host"]);
    expect(result.rows).toEqual([
      { valid_from: "2026-06-24T12:00:00Z", host: "host-a" },
      { valid_from: "2026-06-24T11:00:00Z", host: "host-b" },
    ]);
  });

  test("throws when a task result reports errors", async () => {
    const datasetQueryOutput = () =>
      Promise.resolve([
        {
          stageId: "query",
          resultKind: "ResultKindData",
          errors: [{ message: "boom", text: "boom" }],
        },
      ] as never);

    await expect(
      runFleetQuery(
        {
          config: { customerId: "c", domain: "d", token: "t" },
          pipeline: "filter true",
          window: "20m",
        },
        { datasetQueryOutput: datasetQueryOutput as never },
      ),
    ).rejects.toThrow("boom");
  });
});
