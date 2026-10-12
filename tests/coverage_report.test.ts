import { expect, test } from "bun:test"

import {
  formatCoverageComment,
  parseLcov,
} from "../scripts/report_bun_coverage.ts"

test("Bun LCOV aggregates duplicate records by source line", () => {
  const coverage = parseLcov(`TN:
SF:src\\client.ts
DA:10,0
DA:11,2
LF:2
LH:1
end_of_record
TN:
SF:src/client.ts
DA:10,3
DA:12,0
LF:2
LH:1
end_of_record
TN:
SF:tests/assertions.ts
DA:1,1
LF:1
LH:1
end_of_record
`)

  expect(coverage.get("src/client.ts")).toEqual({ covered: 2, total: 3 })
  expect(coverage.get("tests/assertions.ts")).toEqual({ covered: 1, total: 1 })
})

test("coverage comment reports real changed-file line hits", () => {
  const coverage = parseLcov(`TN:
SF:src/client.ts
DA:1,1
DA:2,0
DA:3,2
LF:3
LH:2
end_of_record
SF:tests/assertions.ts
DA:1,1
LF:1
LH:1
end_of_record
`)
  const comment = formatCoverageComment(
    coverage,
    ["src/client.ts", "README.md"],
    {
      repository: "owner/repo",
      commitSha: "0123456789abcdef",
      runId: "1234",
      runNumber: "56",
    },
  )

  expect(comment).toContain("| 📈 Lines | 🟡 75.0% | 3 / 4 lines |")
  expect(comment).toContain("| `src/client.ts` | 🔴 66.7% (2 / 3) |")
  expect(comment).not.toContain("tests/assertions.ts")
  expect(comment).not.toContain("README.md")
})
