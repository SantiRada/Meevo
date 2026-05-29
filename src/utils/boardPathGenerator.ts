import type { BoardConfig, BoardTileData } from '../services/storage/types';

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
  const { tileCount, pathShape, tileWidth, tileHeight, gap } = config;
  if (tileCount <= 0 && pathShape !== 'Grid') return [];

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
  } else if (pathShape === 'Grid') {
    const cols = config.gridColumns || 8;
    const rows = config.gridRows || 8;
    
    const totalWidth = cols * tileWidth + (cols - 1) * gap;
    const totalHeight = rows * tileHeight + (rows - 1) * gap;
    
    const startX = -totalWidth / 2 + tileWidth / 2;
    const startY = -totalHeight / 2 + tileHeight / 2;

    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push({
          id: id++,
          x: startX + c * (tileWidth + gap),
          y: startY + r * (tileHeight + gap),
          rotation: 0,
        });
      }
    }
  } else if (pathShape === 'Snake') {
    const gTiles = config.gap ?? 10;
    const stepX = tileWidth + gTiles;
    
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < tileCount; i++) {
      let x = boardTilesData?.[i]?.x;
      let y = boardTilesData?.[i]?.y;
      if (x === undefined || y === undefined) {
        x = i * stepX - ((tileCount - 1) * stepX) / 2;
        y = 0;
      }
      points.push({ x, y });
    }

    for (let i = 0; i < tileCount; i++) {
      const p = points[i];
      const p_prev = i > 0 ? points[i-1] : (config.connectEnd && tileCount > 1 ? points[tileCount - 1] : null);
      const p_next = i < tileCount - 1 ? points[i+1] : (config.connectEnd && tileCount > 1 ? points[0] : null);
      
      let v_in = { dx: 1, dy: 0 };
      let v_out = { dx: 1, dy: 0 };
      
      if (p_prev) {
        v_in = { dx: p.x - p_prev.x, dy: p.y - p_prev.y };
      }
      if (p_next) {
        v_out = { dx: p_next.x - p.x, dy: p_next.y - p.y };
      }
      
      if (!p_prev && p_next) v_in = v_out;
      if (!p_next && p_prev) v_out = v_in;
      if (!p_prev && !p_next) { v_in = { dx: 1, dy: 0 }; v_out = { dx: 1, dy: 0 }; }
      
      const mag_in = Math.sqrt(v_in.dx * v_in.dx + v_in.dy * v_in.dy) || 1;
      const mag_out = Math.sqrt(v_out.dx * v_out.dx + v_out.dy * v_out.dy) || 1;
      
      const t_in = { x: v_in.dx / mag_in, y: v_in.dy / mag_in };
      const t_out = { x: v_out.dx / mag_out, y: v_out.dy / mag_out };
      
      const dot = t_in.x * t_out.x + t_in.y * t_out.y;
      const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
      const isSharpTurn = angle >= 80 && angle <= 100;
      
      let roundedVal = boardTilesData?.[i]?.rounded ?? 6;
      let maxR = Math.min(tileWidth / 2, tileHeight / 2) - 1;
      if (maxR < 0) maxR = 0;
      if (roundedVal > maxR) roundedVal = maxR;
      if (roundedVal < 0) roundedVal = 0;
      
      if (isSharpTurn) {
        tiles.push({
          id: i,
          x: p.x,
          y: p.y,
          rotation: Math.atan2(v_out.dy, v_out.dx) * 180 / Math.PI,
        });
      } else {
        let pt1, pt2, pt3;
        if (config.connectEnd && tileCount >= 3) {
           pt1 = points[(i - 1 + tileCount) % tileCount];
           pt2 = points[i];
           pt3 = points[(i + 1) % tileCount];
        } else if (i === 0 && tileCount >= 3) {
           pt1 = points[0]; pt2 = points[1]; pt3 = points[2];
        } else if (i === tileCount - 1 && tileCount >= 3) {
           pt1 = points[tileCount - 3]; pt2 = points[tileCount - 2]; pt3 = points[tileCount - 1];
        } else if (tileCount >= 3) {
           pt1 = points[i-1]; pt2 = points[i]; pt3 = points[i+1];
        } else {
           pt1 = p_prev || { x: p.x - t_out.x * stepX, y: p.y - t_out.y * stepX };
           pt2 = p;
           pt3 = p_next || { x: p.x + t_in.x * stepX, y: p.y + t_in.y * stepX };
        }
        
        const x1 = pt1.x, y1 = pt1.y;
        const x2 = pt2.x, y2 = pt2.y;
        const x3 = pt3.x, y3 = pt3.y;
        
        const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
        const isCollinear = Math.abs(D) < 1e-3;
        
        const outerPts = [];
        const innerPts = [];
        const num_samples = 15;
        const half_len = tileWidth / 2;
        
        let rot = 0;
        let cRot = 0;
        let dir = 1;
        let Ux = 0, Uy = 0, R = 1, theta_p = 0;
        
        if (!isCollinear) {
          const cross = (x2 - x1)*(y3 - y2) - (y2 - y1)*(x3 - x2);
          dir = cross > 0 ? 1 : -1;
          Ux = ((x1*x1 + y1*y1)*(y2 - y3) + (x2*x2 + y2*y2)*(y3 - y1) + (x3*x3 + y3*y3)*(y1 - y2)) / D;
          Uy = ((x1*x1 + y1*y1)*(x3 - x2) + (x2*x2 + y2*y2)*(x1 - x3) + (x3*x3 + y3*y3)*(x2 - x1)) / D;
          R = Math.sqrt((p.x - Ux)*(p.x - Ux) + (p.y - Uy)*(p.y - Uy));
          theta_p = Math.atan2(p.y - Uy, p.x - Ux);
          rot = Math.atan2(dir * Math.cos(theta_p), -dir * Math.sin(theta_p));
        } else {
          rot = Math.atan2(t_out.y, t_out.x);
        }
        cRot = rot;
        
        const h2 = tileHeight / 2;
        const cos = Math.cos(-cRot);
        const sin = Math.sin(-cRot);
        
        for (let j = 0; j <= num_samples; j++) {
          const t = -1 + 2 * (j / num_samples);
          const s = t * half_len;
          
          let outX = 0, outY = 0, inX = 0, inY = 0;
          
          if (isCollinear) {
            const dirX = Math.cos(rot);
            const dirY = Math.sin(rot);
            const nx = -dirY;
            const ny = dirX;
            outX = s * dirX - nx * h2;
            outY = s * dirY - ny * h2;
            inX = s * dirX + nx * h2;
            inY = s * dirY + ny * h2;
          } else {
            const thetaS = theta_p + s / R * dir;
            const px = Ux + R * Math.cos(thetaS);
            const py = Uy + R * Math.sin(thetaS);
            
            const dx = -dir * Math.sin(thetaS);
            const dy = dir * Math.cos(thetaS);
            const nx = -dy;
            const ny = dx;
            
            outX = px - nx * h2 - p.x;
            outY = py - ny * h2 - p.y;
            inX = px + nx * h2 - p.x;
            inY = py + ny * h2 - p.y;
          }
          
          outerPts.push({ x: outX * cos - outY * sin, y: outX * sin + outY * cos });
          innerPts.push({ x: inX * cos - inY * sin, y: inX * sin + inY * cos });
        }
        
        innerPts.reverse();
        
        tiles.push({
          id: i,
          x: p.x,
          y: p.y,
          rotation: rot * 180 / Math.PI,
          isCorner: true,
          cornerPolygon: [...outerPts, ...innerPts],
          maxRounded: maxR
        });
      }
    }
  } else if (pathShape === 'Free Paths') {
    const cols = 8;
    const gTiles = 10;
    
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < tileCount; i++) {
      let x = boardTilesData?.[i]?.x;
      let y = boardTilesData?.[i]?.y;
      if (x === undefined || y === undefined) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        x = c * (tileWidth + gTiles) - ((cols - 1) * (tileWidth + gTiles)) / 2;
        y = r * (tileHeight + gTiles);
      }
      points.push({ x, y });
    }

    const conns = config.freeConnections || [];
    
    for (let i = 0; i < tileCount; i++) {
      const p = points[i];
      const tileConns = conns.filter(c => c.from === i || c.to === i);
      
      let roundedVal = boardTilesData?.[i]?.rounded ?? 6;
      let maxR = Math.min(tileWidth / 2, tileHeight / 2) - 1;
      if (maxR < 0) maxR = 0;
      if (roundedVal > maxR) roundedVal = maxR;
      if (roundedVal < 0) roundedVal = 0;

      if (tileConns.length === 0 || tileConns.length > 2) {
        tiles.push({
          id: i,
          x: p.x,
          y: p.y,
          rotation: 0,
        });
      } else {
        const conn1 = tileConns[0];
        const conn2 = tileConns[1]; 

        const neighbor1Id = conn1.from === i ? conn1.to : conn1.from;
        const neighbor2Id = conn2 ? (conn2.from === i ? conn2.to : conn2.from) : undefined;
        
        let p_prev: {x: number, y: number} | null = null;
        let p_next: {x: number, y: number} | null = null;
        
        if (tileConns.length === 1) {
          if (conn1.to === i) p_prev = points[neighbor1Id];
          else p_next = points[neighbor1Id];
        } else {
          if (conn1.to === i) {
            p_prev = points[neighbor1Id];
            p_next = points[neighbor2Id!];
          } else if (conn2!.to === i) {
            p_prev = points[neighbor2Id!];
            p_next = points[neighbor1Id];
          } else {
            p_prev = points[neighbor1Id];
            p_next = points[neighbor2Id!];
          }
        }

        let v_in = { dx: 1, dy: 0 };
        let v_out = { dx: 1, dy: 0 };
        if (p_prev) v_in = { dx: p.x - p_prev.x, dy: p.y - p_prev.y };
        if (p_next) v_out = { dx: p_next.x - p.x, dy: p_next.y - p.y };
        
        if (!p_prev && p_next) v_in = v_out;
        if (!p_next && p_prev) v_out = v_in;
        if (!p_prev && !p_next) { v_in = { dx: 1, dy: 0 }; v_out = { dx: 1, dy: 0 }; }
        
        const mag_in = Math.sqrt(v_in.dx * v_in.dx + v_in.dy * v_in.dy) || 1;
        const mag_out = Math.sqrt(v_out.dx * v_out.dx + v_out.dy * v_out.dy) || 1;
        
        const t_in = { x: v_in.dx / mag_in, y: v_in.dy / mag_in };
        const t_out = { x: v_out.dx / mag_out, y: v_out.dy / mag_out };
        
        const dot = t_in.x * t_out.x + t_in.y * t_out.y;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
        const isSharpTurn = angle >= 80 && angle <= 100;
        
        if (isSharpTurn) {
          tiles.push({
            id: i,
            x: p.x,
            y: p.y,
            rotation: Math.atan2(v_out.dy, v_out.dx) * 180 / Math.PI,
          });
        } else {
          let pt1, pt2, pt3;
          const stepX = tileWidth + gap; 
          pt1 = p_prev || { x: p.x - t_out.x * stepX, y: p.y - t_out.y * stepX };
          pt2 = p;
          pt3 = p_next || { x: p.x + t_in.x * stepX, y: p.y + t_in.y * stepX };
          
          const x1 = pt1.x, y1 = pt1.y;
          const x2 = pt2.x, y2 = pt2.y;
          const x3 = pt3.x, y3 = pt3.y;
          
          const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
          const isCollinear = Math.abs(D) < 1e-3;
          
          const outerPts = [];
          const innerPts = [];
          const num_samples = 15;
          const half_len = tileWidth / 2;
          
          let rot = 0;
          let cRot = 0;
          let dir = 1;
          let Ux = 0, Uy = 0, R = 1, theta_p = 0;
          
          if (!isCollinear) {
            const cross = (x2 - x1)*(y3 - y2) - (y2 - y1)*(x3 - x2);
            dir = cross > 0 ? 1 : -1;
            Ux = ((x1*x1 + y1*y1)*(y2 - y3) + (x2*x2 + y2*y2)*(y3 - y1) + (x3*x3 + y3*y3)*(y1 - y2)) / D;
            Uy = ((x1*x1 + y1*y1)*(x3 - x2) + (x2*x2 + y2*y2)*(x1 - x3) + (x3*x3 + y3*y3)*(x2 - x1)) / D;
            R = Math.sqrt((p.x - Ux)*(p.x - Ux) + (p.y - Uy)*(p.y - Uy));
            theta_p = Math.atan2(p.y - Uy, p.x - Ux);
            rot = Math.atan2(dir * Math.cos(theta_p), -dir * Math.sin(theta_p));
          } else {
            rot = Math.atan2(t_out.y, t_out.x);
          }
          cRot = rot;
          
          const h2 = tileHeight / 2;
          const cos = Math.cos(-cRot);
          const sin = Math.sin(-cRot);
          
          for (let j = 0; j <= num_samples; j++) {
            const t = -1 + 2 * (j / num_samples);
            const s = t * half_len;
            
            let outX = 0, outY = 0, inX = 0, inY = 0;
            
            if (isCollinear) {
              const dirX = Math.cos(rot);
              const dirY = Math.sin(rot);
              const nx = -dirY;
              const ny = dirX;
              outX = s * dirX - nx * h2;
              outY = s * dirY - ny * h2;
              inX = s * dirX + nx * h2;
              inY = s * dirY + ny * h2;
            } else {
              const thetaS = theta_p + s / R * dir;
              const px = Ux + R * Math.cos(thetaS);
              const py = Uy + R * Math.sin(thetaS);
              
              const dx = -dir * Math.sin(thetaS);
              const dy = dir * Math.cos(thetaS);
              const nx = -dy;
              const ny = dx;
              
              outX = px - nx * h2 - p.x;
              outY = py - ny * h2 - p.y;
              inX = px + nx * h2 - p.x;
              inY = py + ny * h2 - p.y;
            }
            
            outerPts.push({ x: outX * cos - outY * sin, y: outX * sin + outY * cos });
            innerPts.push({ x: inX * cos - inY * sin, y: inX * sin + inY * cos });
          }
          
          innerPts.reverse();
          
          tiles.push({
            id: i,
            x: p.x,
            y: p.y,
            rotation: rot * 180 / Math.PI,
            isCorner: true,
            cornerPolygon: [...outerPts, ...innerPts],
            maxRounded: maxR
          });
        }
      }
    }
  } else if (pathShape === 'Spiral') {
    const rings = Math.max(1, config.gapLine || 1);
    const gTiles = config.gap ?? 10;
    const stepX = tileWidth + gTiles;
    const stepY = tileHeight + gTiles;
    
    type SpiralDir = 'U_L' | 'U_R' | 'D_L' | 'D_R' | 'L_D' | 'L_U' | 'R_D' | 'R_U';
    const dir = (config.spiralDirection || 'U_R') as SpiralDir;
    const isRounded = config.spiralRounded || false;

    const CW_SEQ = [ {dx:1, dy:0}, {dx:0, dy:1}, {dx:-1, dy:0}, {dx:0, dy:-1} ];
    const CCW_SEQ = [ {dx:1, dy:0}, {dx:0, dy:-1}, {dx:-1, dy:0}, {dx:0, dy:1} ];
    
    // Si la flecha dicta giro Horario desde afuera (U_R, D_L, L_U, R_D), 
    // entonces la espiral generada desde adentro hacia afuera debe ser Antihoraria (isCCW = true)
    const isCCW = (dir === 'U_R' || dir === 'D_L' || dir === 'L_U' || dir === 'R_D');
    const baseSeq = isCCW ? CCW_SEQ : CW_SEQ;

    const genTiles: TileNode[] = [];

    if (isRounded) {
      const b = (rings * stepY) / (2 * Math.PI);
      const a = stepY / 2;
      const ds = stepX;
      
      const walkArc = (th_start: number, dist: number, dir: 1 | -1) => {
        let walked = 0;
        let th = th_start;
        const step = 0.05 * dir;
        // prevent infinite loop in edge cases
        let iters = 0;
        while (walked < dist && iters < 1000) {
          const r_curr = a + b * th;
          const d_arc = Math.sqrt(b*b + r_curr*r_curr) * Math.abs(step);
          if (walked + d_arc > dist) {
            const rem = dist - walked;
            th += dir * (rem / Math.sqrt(b*b + r_curr*r_curr));
            break;
          }
          walked += d_arc;
          th += step;
          iters++;
        }
        return th;
      };

      let firstRoundedVal = boardTilesData?.[0]?.rounded ?? 6;
      const maxRFirst = Math.max(0, Math.min(tileWidth / 2, tileHeight / 2) - 1);
      if (firstRoundedVal > maxRFirst) firstRoundedVal = maxRFirst;
      const first_half_len = tileWidth / 2;
      
      let theta = walkArc(0, first_half_len * 0.5, 1);
      
      for (let i = 0; i < tileCount; i++) {
        const r = a + b * theta;
        const x = r * Math.cos(theta);
        let y = r * Math.sin(theta);
        if (isCCW) y = -y;
        
        const dx = b * Math.cos(theta) - r * Math.sin(theta);
        let dy = b * Math.sin(theta) + r * Math.cos(theta);
        if (isCCW) dy = -dy;
        
        const cRot = Math.atan2(dy, dx);
        
        let roundedVal = boardTilesData?.[i]?.rounded ?? 6;
        let maxR = Math.min(tileWidth / 2, tileHeight / 2) - 1; // 1px safety margin
        if (maxR < 0) maxR = 0;
        if (roundedVal > maxR) roundedVal = maxR;
        if (roundedVal < 0) roundedVal = 0;

        const half_len = tileWidth / 2;
        let theta_start = walkArc(theta, half_len, -1);
        if (theta_start < 0) theta_start = 0; // Prevent self-intersection at the origin
        const theta_end = walkArc(theta, half_len, 1);
        
        const getPoint = (th: number) => {
          const rr = a + b * th;
          const px = rr * Math.cos(th);
          let py = rr * Math.sin(th);
          if (isCCW) py = -py;
          const pdx = b * Math.cos(th) - rr * Math.sin(th);
          let pdy = b * Math.sin(th) + rr * Math.cos(th);
          if (isCCW) pdy = -pdy;
          return { x: px, y: py, dx: pdx, dy: pdy };
        };
        
        const getCorners = (pt: ReturnType<typeof getPoint>) => {
          const mag = Math.sqrt(pt.dx*pt.dx + pt.dy*pt.dy);
          const tx = pt.dx / mag;
          const ty = pt.dy / mag;
          const nx = -ty;
          const ny = tx;
          const h2 = tileHeight / 2;
          return {
            outer: { x: pt.x - nx * h2, y: pt.y - ny * h2 },
            inner: { x: pt.x + nx * h2, y: pt.y + ny * h2 }
          };
        };
        
        const toLocal = (p: {x: number, y: number}) => {
          const lx = p.x - x;
          const ly = p.y - y;
          const cos = Math.cos(-cRot);
          const sin = Math.sin(-cRot);
          return {
            x: lx * cos - ly * sin,
            y: lx * sin + ly * cos
          };
        };
        
        const d_theta_span = theta_end - theta_start;
        const num_samples = Math.max(2, Math.ceil(d_theta_span / 0.15)); // sample roughly every 8-9 degrees
        
        const outerPts = [];
        const innerPts = [];
        
        for (let j = 0; j <= num_samples; j++) {
          const th = theta_start + (j / num_samples) * d_theta_span;
          const pt = getPoint(th);
          const corners = getCorners(pt);
          outerPts.push(toLocal(corners.outer));
          innerPts.push(toLocal(corners.inner));
        }
        
        innerPts.reverse();
        const cornerPolygon = [...outerPts, ...innerPts];
        
        genTiles.push({
          id: i,
          x: x,
          y: y,
          rotation: (cRot * 180) / Math.PI,
          isCorner: true,
          cornerPolygon,
          maxRounded: maxR
        });
        
        theta = walkArc(theta, ds, 1);
      }
    } else {
      let cx = 0, cy = 0;
      let dirIdx = 0;
      let placed = 1;
      let segmentsCompleted = 0;
      
      genTiles.push({ id: 0, x: 0, y: 0, rotation: 0 });
      
      const stepMax = Math.max(stepX, stepY);
      const shiftAmount = (tileWidth - tileHeight) / 2;

      while (placed < tileCount) {
        const d = baseSeq[dirIdx];
        
        if (segmentsCompleted > 0) {
          const d_prev = baseSeq[(dirIdx + 3) % 4]; // previous direction is always 90 deg counter-clockwise in the sequence
          cx += d_prev.dx * shiftAmount;
          cy += d_prev.dy * shiftAmount;
        }
        
        const multiplier = Math.floor(segmentsCompleted / 2) + 1;
        const steps = multiplier * rings;

        for (let s = 0; s < steps && placed < tileCount; s++) {
          const currentStep = (s === 0 && segmentsCompleted > 0) ? (stepMax - shiftAmount) : stepMax;
          cx += d.dx * currentStep;
          cy += d.dy * currentStep;
          genTiles.push({ 
            id: placed++, 
            x: cx, 
            y: cy, 
            rotation: (Math.atan2(d.dy, d.dx) * 180) / Math.PI 
          });
        }
        dirIdx = (dirIdx + 1) % 4;
        segmentsCompleted++;
      }
    }

    if (tileCount > 1) {
      const lastDx = genTiles[tileCount-1].x - genTiles[tileCount-2].x;
      const lastDy = genTiles[tileCount-1].y - genTiles[tileCount-2].y;
      
      let targetVec = { dx: 0, dy: 1 };
      if (dir.startsWith('U_')) targetVec = { dx: 0, dy: 1 };
      else if (dir.startsWith('D_')) targetVec = { dx: 0, dy: -1 };
      else if (dir.startsWith('L_')) targetVec = { dx: 1, dy: 0 };
      else if (dir.startsWith('R_')) targetVec = { dx: -1, dy: 0 };
      
      const angleOffset = Math.atan2(targetVec.dy, targetVec.dx) - Math.atan2(lastDy, lastDx);
      
      const cosT = isRounded ? Math.cos(angleOffset) : Math.round(Math.cos(angleOffset));
      const sinT = isRounded ? Math.sin(angleOffset) : Math.round(Math.sin(angleOffset));
      
      genTiles.forEach(t => {
        const nx = t.x * cosT - t.y * sinT;
        const ny = t.x * sinT + t.y * cosT;
        t.x = nx;
        t.y = ny;
        t.rotation = (t.rotation + (angleOffset * 180) / Math.PI) % 360;
      });
    }
    
    genTiles.reverse();
    
    for (let i = 0; i < tileCount; i++) {
      genTiles[i].id = i;
      genTiles[i].rotation = (genTiles[i].rotation + 180) % 360;
      if (genTiles[i].cornerPolygon) {
        genTiles[i].cornerPolygon = genTiles[i].cornerPolygon.map(p => ({ x: -p.x, y: -p.y }));
      }
      tiles.push(genTiles[i]);
    }

    if (tiles.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      tiles.forEach(t => {
        if (t.x < minX) minX = t.x;
        if (t.x > maxX) maxX = t.x;
        if (t.y < minY) minY = t.y;
        if (t.y > maxY) maxY = t.y;
      });
      const offsetX = -(minX + maxX) / 2;
      const offsetY = -(minY + maxY) / 2;
      
      tiles.forEach(t => {
        t.x += offsetX;
        t.y += offsetY;
      });
    }
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
