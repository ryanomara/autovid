# Validation Failure Catalog and Remediation (W4)

This catalog maps validator error codes to fast fixes.

## title-zindex-too-low

- Meaning: Title-like text is below top band.
- Path example: `scenes[0].layers[text:title-main].zIndex`
- Fix: Set `zIndex` to `900` or higher.

## text-overlap-mode-missing

- Meaning: Text layer has no overlap policy.
- Path example: `scenes[1].layers[text:kpi-a].overlapMode`
- Fix: Set `overlapMode` to `avoid-text` (default), or `avoid-all`/`label`/`effect` intentionally.

## scene-contract-unknown

- Meaning: Scene cannot be classified as intro/kpi/line-chart/bar-chart/outro.
- Path example: `scenes[2]`
- Fix: Add contract-defining layers (title-like text, KPI text group, or chart layer).

## scene-duration-too-short

- Meaning: Scene duration is below contract minimum.
- Path example: `scenes[2].endTime`
- Fix: Increase scene duration to contract minimum.

## required-chart-type-missing

- Meaning: Scene classified as chart contract without required chart type.
- Path example: `scenes[2].layers`
- Fix: Add chart with `chartType: "line"` or `chartType: "bar"` as required.

## chart-data-too-short

- Meaning: Chart has fewer than 2 labels/values.
- Path example: `scenes[2].layers[chart:line-1].data`
- Fix: Provide at least two points.

## chart-data-mismatch

- Meaning: labels/value array lengths differ.
- Path example: `scenes[2].layers[chart:line-1].data`
- Fix: Ensure labels and values arrays are same length.

## transition-missing

- Meaning: Scene has missing transition metadata.
- Path example: `scenes[1].transition`
- Fix: Add transition with type and duration.

## transition-duration-out-of-range

- Meaning: Transition duration outside preferred range.
- Path example: `scenes[1].transition.duration`
- Fix: Use duration between `650ms` and `900ms`.

## Playbook: Resolve a Failed Strict Validation

1. Run strict validation and capture report:
   - `node dist/cli/index.js validate <project.json> --mode strict --report <report.json>`
2. Sort issues by `level=error`.
3. Apply fixes exactly at each issue `path`.
4. Re-run strict validation until exit code is `0`.
5. Render only after strict validation passes.
