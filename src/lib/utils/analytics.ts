/**
 * Formats an exact percentage value for display. The underlying value is
 * never rounded by the analytics calculation; only the rendered text is
 * trimmed to 2 decimals so the report never shows a false 100%
 * (e.g. 257/258 renders as 99.61%, not 100%).
 */
export function formatPercentage(percentage: number): string {
    if (!Number.isFinite(percentage)) return "0";
    return String(parseFloat(percentage.toFixed(2)));
}
