/*
    Formato común de los experimentos: tablas en markdown y números en español
*/

export const INTEGER = new Intl.NumberFormat('de-DE');
export const DECIMAL = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const percent = (count: number, total: number): string => `${DECIMAL.format(100 * count / total)}%`;

export function formatTable(header: string[], rows: string[][]): string[] {
    const widths = header.map((title, column) => Math.max(title.length, ...rows.map(row => row[column].length)));
    const line = (cells: string[]) => `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`;

    return [line(header), `|${widths.map(width => '-'.repeat(width + 2)).join('|')}|`, ...rows.map(line)];
}