import { describe, expect, test } from "vite-plus/test";
import { legacySegmentCases, legacyTagDataCases } from "./fixtures/legacy-cases.ts";

describe("legacy UBB parse cases", () => {
  test("records tag-data cases with source and expected behavior", () => {
    expect(legacyTagDataCases).toHaveLength(3);

    for (const parseCase of legacyTagDataCases) {
      expect(parseCase.name).not.toBe("");
      expect(parseCase.source).toMatch(/^Forum\/Ubb\//);
      expect(parseCase.input).not.toBe("");
      expect(parseCase.expected).not.toBe("");
      expect(parseCase.note).not.toBe("");
    }
  });

  test("records segment cases with source and expected behavior", () => {
    expect(legacySegmentCases).toHaveLength(6);

    for (const parseCase of legacySegmentCases) {
      expect(parseCase.name).not.toBe("");
      expect(parseCase.source).toMatch(/^Forum\/Ubb\//);
      expect(parseCase.input).not.toBe("");
      expect(parseCase.expected).not.toBe("");
      expect(parseCase.note).not.toBe("");
    }
  });

  for (const parseCase of legacyTagDataCases) {
    test.todo(`parse tag data: ${parseCase.name}`);
  }

  for (const parseCase of legacySegmentCases) {
    test.todo(`parse segments: ${parseCase.name}`);
  }
});
