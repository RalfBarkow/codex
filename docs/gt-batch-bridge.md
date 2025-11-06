# GT Batch Bridge

## Purpose
- `tools/codex-batch-bridge` wraps `codex exec` so tooling such as Glamorous Toolkit (GT) can send a prompt, wait for completion, and read stdout/stderr without launching the full interactive UI.
- The script loads the OpenAI API key from `~/.secrets/open-ai-api-key.txt` when necessary and accepts additional flags forwarded to `codex exec`.

## CLI Usage
- Pipe a prompt: `echo "Summarise README" | codex-batch-bridge -- -C "$(pwd)"`
- Use a file: `codex-batch-bridge -f prompts/analyse.md -- -m o4-mini --json`
- `--` separates bridge options from the flags you want to pass through to Codex.

## Glamorous Toolkit Snippet
```smalltalk
| process |
process := GtExternalProcess new
    command: 'bash';
    arguments: #('-lc' 'cat prompts/analyse.md | codex-batch-bridge -- -C "$PWD"');
    workingDirectory: FileLocator home / 'workspace' / 'codex';
    runAndWait.

process stdout utf8Decoded.
process stderr utf8Decoded.
```
- Ensure the GT image inherits the dev shell environment (`direnv allow` in the repo or launch GT from within `nix develop`) so `codex-batch-bridge` is on `PATH`.
- Replace `prompts/analyse.md` with the file you want to send; omit the `cat` pipeline when piping ad-hoc text from GT.

## Troubleshooting
- If you see `codex: command not found`, confirm GT knows about the Nix/dev-shell PATH or call the script via absolute path (`FileLocator home / 'workspace' / 'codex' / 'tools' / 'codex-batch-bridge'`).
- For long-running calls, wrap the snippet in a task (e.g. `GTTaskIt`) so the GT UI stays responsive.

## Live Transcript Mirroring
- Run `codex-transcript-stream` (available in the dev shell) to mirror Codex CLI output to a FIFO and log:

```bash
codex-transcript-stream --json
```

- In GT, start a background reader on the FIFO:

```smalltalk
| stream process |
stream := (FileLocator home / 'workspace/codex/.codex-transcript') readStream.
process := [
    [ | line |
        line := stream nextLine.
        line
            ifNil: [ (Delay forMilliseconds: 200) wait ]
            ifNotNil: [ GtTranscript current show: line; cr ] ]
    repeat
] newProcess.
process priority: Processor userBackgroundPriority.
process resume.
```

- Stop when done: `process terminate. stream close.`. This keeps the GT transcript in sync with Codex in real time.
