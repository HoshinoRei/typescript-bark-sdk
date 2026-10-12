import { readFile } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"

export type LineCoverage = {
  covered: number
  total: number
}

export type CoverageReportContext = {
  repository: string
  commitSha: string
  runId: string
  runNumber: string
}

const COMMENT_MARKER = "<!-- bun-coverage-summary -->"
const REPORT_ACTION_HEADER = "### Bun [LCOV]"
const API_VERSION = "2022-11-28"

function normalizePath(filePath: string, workspace: string): string {
  const posixPath = filePath.replaceAll("\\", "/")
  const absolutePath = isAbsolute(posixPath)
    ? resolve(posixPath)
    : resolve(workspace, posixPath)

  return relative(workspace, absolutePath).split(sep).join("/")
}

export function parseLcov(
  content: string,
  workspace: string = process.cwd(),
): Map<string, LineCoverage> {
  const sourceLines = new Map<string, Map<number, boolean>>()
  let currentLines: Map<number, boolean> | undefined

  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith("SF:")) {
      const filePath = normalizePath(line.slice(3), workspace)
      currentLines = sourceLines.get(filePath)
      if (currentLines === undefined) {
        currentLines = new Map<number, boolean>()
        sourceLines.set(filePath, currentLines)
      }
      continue
    }

    if (!line.startsWith("DA:") || currentLines === undefined) {
      continue
    }

    const [lineNumberText, hitsText] = line.slice(3).split(",")
    const lineNumber = Number(lineNumberText)
    const hits = Number(hitsText)

    if (
      !Number.isSafeInteger(lineNumber) ||
      lineNumber < 1 ||
      !Number.isFinite(hits) ||
      hits < 0
    ) {
      continue
    }

    currentLines.set(
      lineNumber,
      (currentLines.get(lineNumber) ?? false) || hits > 0,
    )
  }

  return new Map(
    [...sourceLines].map(([filePath, lines]) => [
      filePath,
      {
        covered: [...lines.values()].filter(Boolean).length,
        total: lines.size,
      },
    ]),
  )
}

function coverageEmoji(coverage: LineCoverage): string {
  if (coverage.total === 0) return "⚪"
  const percent = (coverage.covered / coverage.total) * 100
  return percent >= 90 ? "🟢" : percent >= 70 ? "🟡" : "🔴"
}

export function formatCoverageComment(
  coverageByFile: ReadonlyMap<string, LineCoverage>,
  changedFiles: readonly string[],
  context: CoverageReportContext,
): string {
  const totalCoverage = [...coverageByFile.values()].reduce(
    (total, fileCoverage) => ({
      covered: total.covered + fileCoverage.covered,
      total: total.total + fileCoverage.total,
    }),
    { covered: 0, total: 0 },
  )
  const summaryPercent =
    totalCoverage.total === 0
      ? "N/A"
      : `${((totalCoverage.covered / totalCoverage.total) * 100).toFixed(1)}%`
  const changedPathSet = new Set(
    changedFiles.map((filePath) => filePath.replaceAll("\\", "/")),
  )
  const changedCoverage = [...coverageByFile]
    .filter(([filePath]) => changedPathSet.has(filePath))
    .sort(([left], [right]) => left.localeCompare(right))
  const repositoryUrl = `https://github.com/${context.repository}`
  const lines = [
    "### Bun Coverage",
    "",
    `[Commit \`${context.commitSha.slice(0, 7)}\`](${repositoryUrl}/commit/${context.commitSha}) · ` +
      `[Test run #${context.runNumber}](${repositoryUrl}/actions/runs/${context.runId})`,
    "",
    "### Summary Coverage",
    "",
    "| Metric | Coverage | Details |",
    "|---|---|---|",
    `| 📈 Lines | ${coverageEmoji(totalCoverage)} ${summaryPercent} | ${totalCoverage.covered} / ${totalCoverage.total} lines |`,
    "",
    "### Files Changed Coverage",
    "",
    "| File | Lines |",
    "|---|---|",
  ]

  if (changedCoverage.length === 0) {
    lines.push("| No changed files with LCOV data | |")
  } else {
    for (const [filePath, fileCoverage] of changedCoverage) {
      const percent =
        fileCoverage.total === 0
          ? "N/A"
          : `${((fileCoverage.covered / fileCoverage.total) * 100).toFixed(1)}%`
      const markdownPath = filePath
        .replaceAll("|", "\\|")
        .replaceAll("`", "\\`")
      lines.push(
        `| \`${markdownPath}\` | ${coverageEmoji(fileCoverage)} ${percent} (${fileCoverage.covered} / ${fileCoverage.total}) |`,
      )
    }
  }

  lines.push(
    "",
    "> Bun LCOV reports line coverage only; function and branch coverage are unavailable.",
    COMMENT_MARKER,
  )

  return lines.join("\n")
}

type PullRequestEvent = {
  pull_request?: {
    head: { sha: string }
    number: number
  }
}

type ChangedFile = { filename: string }
type IssueComment = { body: string; id: number }

async function githubRequest<T>(
  apiUrl: string,
  token: string,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": API_VERSION,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(
      `GitHub API ${init?.method ?? "GET"} ${endpoint} failed: ` +
        `${response.status} ${await response.text()}`,
    )
  }

  return (await response.json()) as T
}

async function listPullRequestFiles(
  apiUrl: string,
  token: string,
  repository: string,
  pullNumber: number,
): Promise<string[]> {
  const files: string[] = []

  for (let page = 1; ; page++) {
    const pageFiles = await githubRequest<ChangedFile[]>(
      apiUrl,
      token,
      `/repos/${repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
    )
    files.push(...pageFiles.map((file) => file.filename))
    if (pageFiles.length < 100) return files
  }
}

async function listPullRequestComments(
  apiUrl: string,
  token: string,
  repository: string,
  pullNumber: number,
): Promise<IssueComment[]> {
  const comments: IssueComment[] = []

  for (let page = 1; ; page++) {
    const pageComments = await githubRequest<IssueComment[]>(
      apiUrl,
      token,
      `/repos/${repository}/issues/${pullNumber}/comments?per_page=100&page=${page}`,
    )
    comments.push(...pageComments)
    if (pageComments.length < 100) return comments
  }
}

async function publishCoverageComment(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  const repository = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  const coveragePath =
    process.env.BUN_COVERAGE_FILE ?? "test-result/bun-coverage/lcov.info"

  if (!eventPath || !repository || !token) {
    throw new Error("Missing GitHub event, repository, or token environment.")
  }

  let lcovContent: string
  try {
    lcovContent = await readFile(coveragePath, "utf8")
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.log(
        `Skipping coverage comment; ${coveragePath} was not generated.`,
      )
      return
    }
    throw error
  }

  const event = JSON.parse(
    await readFile(eventPath, "utf8"),
  ) as PullRequestEvent
  const pullRequest = event.pull_request
  if (!pullRequest) {
    console.log("Skipping coverage comment; this is not a pull request event.")
    return
  }

  const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com"
  const coverageByFile = parseLcov(lcovContent)
  const changedFiles = await listPullRequestFiles(
    apiUrl,
    token,
    repository,
    pullRequest.number,
  )
  const body = formatCoverageComment(coverageByFile, changedFiles, {
    repository,
    commitSha: pullRequest.head.sha,
    runId: process.env.GITHUB_RUN_ID ?? "",
    runNumber: process.env.GITHUB_RUN_NUMBER ?? "",
  })
  const comments = await listPullRequestComments(
    apiUrl,
    token,
    repository,
    pullRequest.number,
  )
  const existingComment = comments.find(
    (comment) =>
      comment.body.includes(COMMENT_MARKER) ||
      comment.body.includes(REPORT_ACTION_HEADER),
  )

  if (existingComment) {
    await githubRequest<IssueComment>(
      apiUrl,
      token,
      `/repos/${repository}/issues/comments/${existingComment.id}`,
      { method: "PATCH", body: JSON.stringify({ body }) },
    )
    console.log(`Updated coverage comment ${existingComment.id}.`)
  } else {
    await githubRequest<IssueComment>(
      apiUrl,
      token,
      `/repos/${repository}/issues/${pullRequest.number}/comments`,
      { method: "POST", body: JSON.stringify({ body }) },
    )
    console.log("Created Bun coverage comment.")
  }
}

if (import.meta.main) {
  await publishCoverageComment()
}
