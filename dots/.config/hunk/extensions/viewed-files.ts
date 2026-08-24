import type {
  ExtensionDiffFile,
  ExtensionDiffHunk,
  ExtensionFileViewSourceRange,
  ExtensionFileViewSpan,
  HunkExtensionAPI,
} from "hunkdiff/extension";

interface ViewedFileState {
  patch: string;
}

const VIEW_ID = "viewed";
const viewedFiles = new Map<string, ViewedFileState>();

/**
 * Report whether the file still has an authoritative viewed entry.
 */
function isViewed(file: ExtensionDiffFile): boolean {
  return viewedFiles.get(file.path)?.patch === file.patch;
}

/**
 * Record the exact path and patch that define one viewed file.
 */
function addViewed(file: ExtensionDiffFile): void {
  viewedFiles.set(file.path, { patch: file.patch });
}

/**
 * Remove the viewed entry for one file path.
 */
function removeViewed(file: ExtensionDiffFile): void {
  viewedFiles.delete(file.path);
}

/**
 * Remove viewed entries absent from or changed in the replacement changeset.
 */
function reconcileViewedFiles(files: readonly ExtensionDiffFile[]): void {
  const currentPatches = new Map(files.map((file) => [file.path, file.patch]));

  for (const [path, state] of viewedFiles) {
    if (currentPatches.get(path) !== state.patch) viewedFiles.delete(path);
  }
}

/**
 * Build the semantic summary text painted by the active theme.
 */
function buildSummarySpans(file: ExtensionDiffFile): readonly ExtensionFileViewSpan[] {
  return [
    { text: "✓", tone: "added" },
    {
      text: ` Viewed  +${file.stats.additions} -${file.stats.deletions}`,
      tone: "muted",
    },
  ];
}

/**
 * Report whether a source range is usable by the file-view API.
 */
function isValidSourceRange(range: readonly [number, number] | undefined): range is readonly [number, number] {
  return range !== undefined && range[0] >= 1 && range[1] >= range[0];
}

/**
 * Bind one compact row to one hunk so every visible note retains its anchor.
 */
function buildSourceRanges(hunk: ExtensionDiffHunk): readonly ExtensionFileViewSourceRange[] {
  const ranges: ExtensionFileViewSourceRange[] = [];
  if (isValidSourceRange(hunk.oldRange)) ranges.push({ side: "old", range: hunk.oldRange });
  if (isValidSourceRange(hunk.newRange)) ranges.push({ side: "new", range: hunk.newRange });
  return ranges;
}

export default function viewedFilesExtension(hunk: HunkExtensionAPI): void {
  hunk.registerFileView({
    id: VIEW_ID,
    title: "Viewed",
    matches: isViewed,
    layout: ({ file }) => {
      const hunks = file.hunks ?? [];
      const rows = hunks.length === 0
        ? [{ id: "viewed-summary", spans: buildSummarySpans(file) }]
        : hunks.map((hunk, index) => ({
            id: `viewed-hunk-${index}`,
            spans: index === 0 ? buildSummarySpans(file) : [{ text: "·", tone: "muted" as const }],
            sourceRanges: buildSourceRanges(hunk),
          }));

      return {
        rows,
        hunkRows: hunks.map((_, index) => ({ startRow: index, endRow: index })),
      };
    },
  });

  hunk.registerCommand(
    { id: "toggle", title: "Toggle file viewed", key: "v" },
    (ctx) => {
      const file = ctx.selection.file;
      if (!file) {
        ctx.notify("There is no focused file to toggle as viewed.", "warning");
        return;
      }

      if (isViewed(file)) {
        removeViewed(file);
        ctx.fileViews.select(null);
        if ((file.hunks?.length ?? 0) > 0) ctx.navigation.selectHunk(file.id, 0);
        return;
      }

      addViewed(file);
      ctx.fileViews.select(VIEW_ID);
      ctx.fileViews.refresh(VIEW_ID, { fileId: file.id });
    },
  );

  hunk.on("changeset_loaded", ({ changeset }) => {
    reconcileViewedFiles(changeset.files);
  });
  hunk.on("session_reload", ({ changeset }) => {
    reconcileViewedFiles(changeset.files);
  });
}
