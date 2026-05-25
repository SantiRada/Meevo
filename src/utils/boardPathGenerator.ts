import type { BoardConfig, BoardTileData } from '../../services/storage/types';

export interface TileNode {
  id: number;
  x: number;
  y: number;
  rotation: number;
  isCorner?: boolean;
  cornerPolygon?: {x: number, y: number}[];
  maxRounded?: number;
}

export function generateBoardPath(config: BoardConfig, boardTilesData?: Record<number, BoardTileData>): TileNode[] {
  const { tileCount, pathShape, tileWidth, gap } = config;
  if (tileCount <= 0) return [];

  const tiles: TileNode[] = [];
  const stepDistance = tileWidth + gap;

  if (pathShape === 'Circle') {
    const circumference = tileCount * stepDistance;
    const radius = Math.max(circumference / (2 * Math.PI), tileWidth);

    for (let i = 0; i < tileCount; i++) {
      const angle = (i / tileCount) * 2 * Math.PI;
      tiles.push({
        id: i,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        rotation: (angle * 180) / Math.PI + 90,
      });
    }
  } else if (pathShape === 'Square') {
    // For Square, we distribute like a polygon with 4 sides
    tiles.push(...generatePolygonTiles(4, config, Math.PI / 4, boardTilesData));
  } else if (pathShape === 'Hexagon') {
    // Hexagon: flat bottom. Start angle offset to make bottom flat: Math.PI / 2
    tiles.push(...generatePolygonTiles(6, config, Math.PI / 2, boardTilesData));
  } else if (pathShape === 'Pentagon') {
    // Pentagon: flat bottom. Start angle offset to make bottom flat: Math.PI / 2
    tiles.push(...generatePolygonTiles(5, config, Math.PI / 2, boardTilesData));
  } else {
    // Snake / Linear fallback
    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        id: i,
        x: i * stepDistance - ((tileCount * stepDistance) / 2),
        y: Math.sin(i * 0.5) * 100,
        rotation: Math.cos(i * 0.5) * 30,
      });
    }
  }

  return tiles;
}

function generatePolygonTiles(
  sides: number, 
  config: BoardConfig,
  angleOffset: number,
  boardTilesData?: Record<number, BoardTileData>
): TileNode[] {
  const { tileCount, tileWidth, tileHeight, gap } = config;
  const stepDistance = tileWidth + gap;

  if (tileCount < sides) return []; // Fallback if too few tiles

  const tiles: TileNode[] = [];
  const interiorTotal = tileCount - sides;
  const baseInterior = Math.floor(interiorTotal / sides);
  const remainder = interiorTotal % sides;

  const maxDim = Math.max(tileWidth, tileHeight);

  // We want the perimeter to match the step distances.
  let edgeLength = 0;
  if (sides === 4) {
    const N_avg = interiorTotal / sides;
    edgeLength = maxDim + N_avg * tileWidth + (N_avg + 1) * gap;
  } else {
    const avgStepsPerEdge = tileCount / sides;
    edgeLength = avgStepsPerEdge * stepDistance;
  }
  
  // Radius of circumscribed circle: R = edgeLength / (2 * sin(PI / sides))
  const radius = edgeLength / (2 * Math.sin(Math.PI / sides));

  // Generate vertices
  const vertices: { x: number, y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = angleOffset + (i / sides) * 2 * Math.PI;
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle)
    });
  }

  let tileId = 0;

  for (let i = 0; i < sides; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % sides];
    
    // Direction vector for this edge
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const edgeAngle = Math.atan2(dy, dx);
    const rotation = (edgeAngle * 180) / Math.PI;

    // 1. Corner tile at p1
    // The rotation for the corner tile should be the bisector of the two edges, 
    // or just aligned to this edge. Let's align it to the bisector for nice wedge clipping.
    const prevP = vertices[(i - 1 + sides) % sides];
    const angle1 = Math.atan2(p1.y - prevP.y, p1.x - prevP.x); // Prev edge angle
    const angle2 = edgeAngle; // Curr edge angle
    
    // Bisector angle
    let diff = angle2 - angle1;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    const bisector = angle1 + diff / 2;

    const interiorTilesThisEdge = baseInterior + (i < remainder ? 1 : 0);
    const steps = interiorTilesThisEdge + 1;
    const stepDist = edgeLength / steps;

    const isSquare = sides === 4;
    let maxR = Math.min(tileWidth / 2, tileHeight / 2);

    if (isSquare) {
      tiles.push({
        id: tileId++,
        x: p1.x,
        y: p1.y,
        rotation, // Aligned with the current edge (0, 90, 180, 270)
        isCorner: true,
        maxRounded: maxR
      });
    } else {
      // Calculate Exact 6-Point Polygon for the Corner Tile (Pentagon/Hexagon)
      const D = stepDist - tileWidth / 2 - gap;
      const alpha = Math.PI / sides;
      const tH2 = tileHeight / 2;

      const num = tH2 - D * Math.sin(alpha);
      const den = 1 - Math.sin(alpha);
      const geoMax = den > 0.001 ? num / den : tH2;
      maxR = Math.max(0, Math.min(tH2, D, geoMax)) - 1; // 1px safety margin

      // We read the rounded value from boardTilesData for this specific corner tile id
      const customRounded = boardTilesData?.[tileId]?.rounded;
      let R = customRounded !== undefined ? Math.max(0, customRounded) : 6;
      if (R > maxR) R = maxR;

      const D_inset = D - R;
      const tH2_inset = tH2 - R;

      const v_out_center = { x: 0, y: -tH2_inset / Math.cos(alpha) };
      const v_out_next = { 
        x: D_inset * Math.cos(alpha) + tH2_inset * Math.sin(alpha), 
        y: D_inset * Math.sin(alpha) - tH2_inset * Math.cos(alpha) 
      };
      const v_in_next = { 
        x: D_inset * Math.cos(alpha) - tH2_inset * Math.sin(alpha), 
        y: D_inset * Math.sin(alpha) + tH2_inset * Math.cos(alpha) 
      };
      const v_in_center = { x: 0, y: tH2_inset / Math.cos(alpha) };
      const v_in_prev = { 
        x: -D_inset * Math.cos(alpha) + tH2_inset * Math.sin(alpha), 
        y: D_inset * Math.sin(alpha) + tH2_inset * Math.cos(alpha) 
      };
      const v_out_prev = { 
        x: -D_inset * Math.cos(alpha) - tH2_inset * Math.sin(alpha), 
        y: D_inset * Math.sin(alpha) - tH2_inset * Math.cos(alpha) 
      };

      tiles.push({
        id: tileId++,
        x: p1.x,
        y: p1.y,
        rotation: (bisector * 180) / Math.PI,
        isCorner: true,
        cornerPolygon: [v_out_center, v_out_next, v_in_next, v_in_center, v_in_prev, v_out_prev],
        maxRounded: maxR
      });
    }

    // 2. Interior tiles along the edge
    if (isSquare) {
      const gapThisEdge = (edgeLength - maxDim - interiorTilesThisEdge * tileWidth) / (interiorTilesThisEdge + 1);
      
      for (let j = 1; j <= interiorTilesThisEdge; j++) {
        const dist = maxDim / 2 + gapThisEdge + tileWidth / 2 + (j - 1) * (tileWidth + gapThisEdge);
        const t = dist / edgeLength;
        tiles.push({
          id: tileId++,
          x: p1.x + dx * t,
          y: p1.y + dy * t,
          rotation, 
          maxRounded: Math.min(tileWidth / 2, tileHeight / 2)
        });
      }
    } else {
      const steps = interiorTilesThisEdge + 1;
      for (let j = 1; j <= interiorTilesThisEdge; j++) {
        const t = j / steps;
        tiles.push({
          id: tileId++,
          x: p1.x + dx * t,
          y: p1.y + dy * t,
          rotation,
        });
      }
    }
  }

  return tiles;
}
