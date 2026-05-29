export interface SnapLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'h' | 'v';
}

export interface SnapResult {
  x: number;
  y: number;
  lines: SnapLine[];
}

export interface Rect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isBounds?: boolean; // True if this rect represents the container bounds
}

export function computeSnaps(
  virtualX: number,
  virtualY: number,
  width: number,
  height: number,
  currentId: string,
  rects: Rect[],
  scale: number,
  snapThreshold: number = 5
): SnapResult {
  const threshold = snapThreshold / scale;

  let bestSnapX = virtualX;
  let bestDistX = Infinity;
  let snappedLinesV: SnapLine[] = [];

  let bestSnapY = virtualY;
  let bestDistY = Infinity;
  let snappedLinesH: SnapLine[] = [];

  // Moving object edges
  const mLeft = virtualX;
  const mCenter = virtualX + width / 2;
  const mRight = virtualX + width;

  const mTop = virtualY;
  const mMiddle = virtualY + height / 2;
  const mBottom = virtualY + height;

  const edgesV = [
    { type: 'left', val: mLeft, offset: 0 },
    { type: 'center', val: mCenter, offset: width / 2 },
    { type: 'right', val: mRight, offset: width }
  ];

  const edgesH = [
    { type: 'top', val: mTop, offset: 0 },
    { type: 'middle', val: mMiddle, offset: height / 2 },
    { type: 'bottom', val: mBottom, offset: height }
  ];

  // Helper to test vertical snaps
  const testSnapV = (movingVal: number, targetVal: number, offset: number, targetRect: Rect, lineType: string) => {
    const dist = Math.abs(movingVal - targetVal);
    if (dist < threshold) {
      if (dist < bestDistX) {
        bestDistX = dist;
        bestSnapX = targetVal - offset;
        snappedLinesV = []; // clear worse snaps
      }
      if (dist === bestDistX) {
        // Add snap line
        const minY = Math.min(virtualY, targetRect.y);
        const maxY = Math.max(virtualY + height, targetRect.y + targetRect.h);
        snappedLinesV.push({
          id: `v-${targetRect.id}-${lineType}`,
          x1: targetVal,
          y1: targetRect.isBounds ? 0 : minY,
          x2: targetVal,
          y2: targetRect.isBounds ? targetRect.h : maxY,
          type: 'v'
        });
      }
    }
  };

  // Helper to test horizontal snaps
  const testSnapH = (movingVal: number, targetVal: number, offset: number, targetRect: Rect, lineType: string) => {
    const dist = Math.abs(movingVal - targetVal);
    if (dist < threshold) {
      if (dist < bestDistY) {
        bestDistY = dist;
        bestSnapY = targetVal - offset;
        snappedLinesH = [];
      }
      if (dist === bestDistY) {
        const minX = Math.min(virtualX, targetRect.x);
        const maxX = Math.max(virtualX + width, targetRect.x + targetRect.w);
        snappedLinesH.push({
          id: `h-${targetRect.id}-${lineType}`,
          x1: targetRect.isBounds ? 0 : minX,
          y1: targetVal,
          x2: targetRect.isBounds ? targetRect.w : maxX,
          y2: targetVal,
          type: 'h'
        });
      }
    }
  };

  for (const rect of rects) {
    if (rect.id === currentId) continue;

    const tLeft = rect.x;
    const tCenter = rect.x + rect.w / 2;
    const tRight = rect.x + rect.w;

    const tTop = rect.y;
    const tMiddle = rect.y + rect.h / 2;
    const tBottom = rect.y + rect.h;

    // Test all combinations of vertical edges
    for (const mEdge of edgesV) {
      testSnapV(mEdge.val, tLeft, mEdge.offset, rect, 'left');
      testSnapV(mEdge.val, tCenter, mEdge.offset, rect, 'center');
      testSnapV(mEdge.val, tRight, mEdge.offset, rect, 'right');
    }

    // Test all combinations of horizontal edges
    for (const mEdge of edgesH) {
      testSnapH(mEdge.val, tTop, mEdge.offset, rect, 'top');
      testSnapH(mEdge.val, tMiddle, mEdge.offset, rect, 'middle');
      testSnapH(mEdge.val, tBottom, mEdge.offset, rect, 'bottom');
    }
  }

  return {
    x: bestDistX < threshold ? bestSnapX : virtualX,
    y: bestDistY < threshold ? bestSnapY : virtualY,
    lines: [...snappedLinesV, ...snappedLinesH]
  };
}
