/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * How many fixed-height table rows fit in the scroll area, so a page fills
 * the screen instead of leaving a gap under eight rows on a tall monitor.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';

export function useLoopFitRows(
  scrollRef: RefObject<HTMLElement>,
  rowHeightPx: number,
  headerHeightPx: number,
  minRows: number,
): number {
  const [rows, setRows] = useState(minRows);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const measure = (): void => {
      setRows(Math.max(minRows, Math.floor((element.clientHeight - headerHeightPx) / rowHeightPx)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [scrollRef, rowHeightPx, headerHeightPx, minRows]);

  return rows;
}
