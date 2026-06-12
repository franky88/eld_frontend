// ── Canvas dimensions ─────────────────────────────────────────────────────────
export const CANVAS_W = 1100;
export const CANVAS_H = 660;

// ── Header row geometry (verified pixel math) ────────────────────────────────
//   R0 : y=0,   h=28  → bottom border at y=28
//   R1 : y=28,  h=72  → bottom border at y=100
//   R2 : y=100, h=48  → bottom border at y=148
//   R3 : y=148, h=40  → bottom border at y=188
//   Ruler: y=188, h=24 → ruler bottom at y=212
//   Grid starts at y=212

// ── Grid geometry ─────────────────────────────────────────────────────────────
export const GRID_X = 100;
export const GRID_W = 860;
export const GRID_TOP_Y = 212; // ruler bottom = 188+24
export const ROW_H = 42;
export const DOT_R = 3.5;

// ── Row Y positions ───────────────────────────────────────────────────────────
export const ROW_Y = {
  offDuty: GRID_TOP_Y,
  sleeperBerth: GRID_TOP_Y + ROW_H,
  driving: GRID_TOP_Y + ROW_H * 2,
  onDutyNotDriving: GRID_TOP_Y + ROW_H * 3,
};

// ── Hour → pixel ──────────────────────────────────────────────────────────────
export const hrToX = (hour) => GRID_X + (hour / 24) * GRID_W;

// ── Small helpers ─────────────────────────────────────────────────────────────
function ln(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function bx(ctx, x, y, w, h) {
  ctx.strokeRect(x, y, w, h);
}
function fbx(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function txt(ctx, s, x, y, font, align = "left", color = "#000") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ═════════════════════════════════════════════════════════════════════════════
// MASTER DRAW
// ═════════════════════════════════════════════════════════════════════════════
export function drawLogSheet(ctx, dayPlan) {
  if (!ctx || !dayPlan) return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  fbx(ctx, 0, 0, CANVAS_W, CANVAS_H, "#FFFFFF");
  drawHeader(ctx, dayPlan.fields);
  drawTopRuler(ctx);
  drawGrid(ctx);
  drawStatusLines(ctx, dayPlan.events);
  drawTotals(ctx, dayPlan.totals);
  drawBottomRuler(ctx);
  drawRemarks(ctx, dayPlan.remarks);
}

// ═════════════════════════════════════════════════════════════════════════════
// HEADER
// Row 0  y=0   h=28  — banner strip
// Row 1  y=28  h=72  — date | miles | signature | vehicle
// Row 2  y=100 h=48  — carrier | co-driver
// Row 3  y=148 h=40  — main office | total hours label
// ═════════════════════════════════════════════════════════════════════════════
function drawHeader(ctx, f) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  const W = CANVAS_W;
  const PAD = 6;

  // ── Row 0: banner  (y=0, h=28) ────────────────────────────────────────────
  // All text baselines must be ≤ 20 so they sit 8 px above the bottom border.
  const R0Y = 0,
    R0H = 28;
  fbx(ctx, 0, R0Y, W, R0H, "#f0f0f0");
  bx(ctx, 0, R0Y, W, R0H);

  txt(
    ctx,
    "U.S. DEPARTMENT OF TRANSPORTATION",
    PAD,
    R0Y + 12,
    "bold 9px Arial",
    "left",
  );

  // Centre block: two lines, top at +10, bottom at +20  (border at +28 → 8px gap)
  txt(ctx, "DRIVER'S DAILY LOG", W / 2, R0Y + 12, "bold 12px Arial", "center");
  txt(
    ctx,
    "(ONE CALENDAR DAY — 24 HOURS)",
    W / 2,
    R0Y + 22,
    "7.5px Arial",
    "center",
    "#333",
  );

  // Right block: two lines at +10 / +20
  txt(
    ctx,
    "ORIGINAL — Submit to carrier within 13 days",
    W - PAD,
    R0Y + 10,
    "7px Arial",
    "right",
    "#333",
  );
  txt(
    ctx,
    "DUPLICATE — Driver retains possession for eight days",
    W - PAD,
    R0Y + 20,
    "7px Arial",
    "right",
    "#333",
  );

  // ── Row 1: Date | Miles | Signature | Vehicle  (y=28, h=72) ──────────────
  // Large text baseline at R1Y+34, sub-label baseline at R1Y+54.
  // Bottom border at R1Y+72 → sub-label has 18 px breathing room.
  const R1Y = R0Y + R0H; // 28
  const R1H = 72;
  bx(ctx, 0, R1Y, W, R1H);

  // — Date (0..220) —
  bx(ctx, 0, R1Y, 220, R1H);
  const dp = (f.date || "----  --  --").split("-");
  const mo = dp[1] || "--",
    dy = dp[2] || "--",
    yr = dp[0] || "----";
  txt(ctx, mo, 40, R1Y + 34, "bold 22px Arial", "center");
  txt(ctx, dy, 90, R1Y + 34, "bold 22px Arial", "center");
  txt(ctx, yr, 165, R1Y + 34, "bold 22px Arial", "center");
  txt(ctx, "(MONTH)", 40, R1Y + 54, "7px Arial", "center", "#555");
  txt(ctx, "(DAY)", 90, R1Y + 54, "7px Arial", "center", "#555");
  txt(ctx, "(YEAR)", 165, R1Y + 54, "7px Arial", "center", "#555");
  // internal dividers
  ctx.lineWidth = 0.6;
  ln(ctx, 60, R1Y, 60, R1Y + R1H);
  ln(ctx, 115, R1Y, 115, R1Y + R1H);
  ctx.lineWidth = 1;

  // — Miles (220..420) —
  bx(ctx, 220, R1Y, 200, R1H);
  txt(
    ctx,
    String(f.total_miles ?? "0"),
    320,
    R1Y + 34,
    "bold 22px Arial",
    "center",
  );
  txt(
    ctx,
    "(TOTAL MILES DRIVING TODAY)",
    320,
    R1Y + 54,
    "7px Arial",
    "center",
    "#555",
  );

  // — Signature (420..720) —
  // Certification text at R1Y+14 (top), signature at R1Y+40 (middle)
  // Sub-caption "(DRIVER'S SIGNATURE)" removed from this cell — no crowding.
  bx(ctx, 420, R1Y, 300, R1H);
  txt(
    ctx,
    "I certify that these entries are true and correct",
    570,
    R1Y + 18,
    "italic 7.5px Arial",
    "center",
    "#444",
  );
  txt(
    ctx,
    f.driver_signature || "Driver",
    570,
    R1Y + 44,
    "bold italic 18px Arial",
    "center",
  );

  // — Vehicle (720..end) —
  bx(ctx, 720, R1Y, W - 720, R1H);
  txt(
    ctx,
    f.tractor_number && f.tractor_number !== "N/A"
      ? f.tractor_number
      : "123, 45678",
    850,
    R1Y + 34,
    "bold 20px Arial",
    "center",
  );
  txt(
    ctx,
    "VEHICLE NUMBERS — (SHOW EACH UNIT)",
    850,
    R1Y + 54,
    "7px Arial",
    "center",
    "#555",
  );

  // ── Row 2: Carrier | Co-driver  (y=100, h=48) ────────────────────────────
  // Main text at R2Y+22, sub-label at R2Y+38. Border at R2Y+48 → 10px gap.
  const R2Y = R1Y + R1H; // 100
  const R2H = 48;
  bx(ctx, 0, R2Y, W, R2H);

  bx(ctx, 0, R2Y, 420, R2H);
  txt(
    ctx,
    f.carrier && f.carrier !== "N/A" ? f.carrier : "Independent Carrier",
    210,
    R2Y + 22,
    "bold italic 15px Arial",
    "center",
  );
  txt(
    ctx,
    "(NAME OF CARRIER OR CARRIERS)",
    210,
    R2Y + 38,
    "7px Arial",
    "center",
    "#555",
  );

  bx(ctx, 420, R2Y, W - 420, R2H);
  txt(
    ctx,
    f.driver_signature || "Driver",
    660,
    R2Y + 22,
    "bold italic 14px Arial",
    "center",
  );
  txt(
    ctx,
    "(DRIVER'S SIGNATURE IN FULL)",
    590,
    R2Y + 38,
    "7px Arial",
    "center",
    "#555",
  );
  txt(ctx, "—", 860, R2Y + 22, "12px Arial", "center");
  txt(ctx, "(NAME OF CO-DRIVER)", 860, R2Y + 38, "7px Arial", "center", "#555");

  // ── Row 3: Main office | Total Hours label  (y=148, h=40) ────────────────
  // Main text at R3Y+18, sub-label at R3Y+30. Border at R3Y+40 → 10px gap.
  const R3Y = R2Y + R2H; // 148
  const R3H = 40;
  bx(ctx, 0, R3Y, W, R3H);

  bx(ctx, 0, R3Y, 420, R3H);
  txt(
    ctx,
    f.home_terminal || "Home Terminal",
    210,
    R3Y + 18,
    "bold italic 14px Arial",
    "center",
  );
  txt(
    ctx,
    "(MAIN OFFICE ADDRESS)",
    210,
    R3Y + 30,
    "7px Arial",
    "center",
    "#555",
  );

  bx(ctx, 420, R3Y, W - 420, R3H);
  const totX = GRID_X + GRID_W;
  txt(ctx, "TOTAL", totX + 34, R3Y + 14, "bold 8px Arial", "center");
  txt(ctx, "HOURS", totX + 34, R3Y + 24, "bold 8px Arial", "center");
}

// ═════════════════════════════════════════════════════════════════════════════
// TOP RULER  (y=188, h=24) — immediately after Row 3 bottom
// ═════════════════════════════════════════════════════════════════════════════
function drawTopRuler(ctx) {
  const RY = 188; // R0(28)+R1(72)+R2(48)+R3(40) = 188
  const RH = 24;

  fbx(ctx, GRID_X, RY, GRID_W, RH, "#f8f8f4");
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;

  // Row labels on the left margin
  const labels = [
    ["Off", "Duty"],
    ["Sleeper", "Berth"],
    ["Driving", null],
    ["On Duty", "(Not\nDriving)"],
  ];
  Object.keys(ROW_Y).forEach((k, i) => {
    const ry = ROW_Y[k];
    const mid = ry + ROW_H / 2;
    const lns = labels[i];
    ctx.fillStyle = "#000";
    ctx.textAlign = "right";
    if (!lns[1]) {
      ctx.font = "bold 8.5px Arial";
      ctx.fillText(lns[0], GRID_X - 4, mid + 3);
    } else if (lns[1].includes("\n")) {
      const parts = lns[1].split("\n");
      ctx.font = "bold 8.5px Arial";
      ctx.fillText(lns[0], GRID_X - 4, mid - 8);
      ctx.font = "7.5px Arial";
      ctx.fillText(parts[0], GRID_X - 4, mid + 2);
      ctx.fillText(parts[1], GRID_X - 4, mid + 11);
    } else {
      ctx.font = "bold 8.5px Arial";
      ctx.fillText(lns[0], GRID_X - 4, mid - 3);
      ctx.font = "7.5px Arial";
      ctx.fillText(lns[1], GRID_X - 4, mid + 8);
    }
  });

  drawRulerTicks(ctx, RY, RH, true);
}

// ═════════════════════════════════════════════════════════════════════════════
// RULER TICKS
// ═════════════════════════════════════════════════════════════════════════════
function drawRulerTicks(ctx, rulerY, rulerH, showLabels) {
  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h);
    if (showLabels) {
      const label =
        h === 0
          ? "Midnight"
          : h === 24
            ? "Midnight"
            : h === 12
              ? "Noon"
              : String(h);
      const font =
        h === 0 || h === 12 || h === 24 ? "bold 8px Arial" : "8px Arial";
      txt(ctx, label, x, rulerY + rulerH - 5, font, "center");
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GRID
// ═════════════════════════════════════════════════════════════════════════════
function drawGrid(ctx) {
  Object.values(ROW_Y).forEach((ry, i) => {
    fbx(ctx, GRID_X, ry, GRID_W, ROW_H, i % 2 === 0 ? "#FAFAF6" : "#F4F4EE");
  });

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  bx(ctx, GRID_X, GRID_TOP_Y, GRID_W, ROW_H * 4);

  Object.values(ROW_Y).forEach((ry) => {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.8;
    ln(ctx, GRID_X, ry + ROW_H, GRID_X + GRID_W, ry + ROW_H);

    for (let h = 0; h <= 24; h++) {
      const x = hrToX(h);
      ctx.strokeStyle = h % 6 === 0 ? "#666" : "#bbb";
      ctx.lineWidth = h % 6 === 0 ? 0.8 : 0.5;
      ln(ctx, x, ry, x, ry + ROW_H);

      if (h < 24) {
        for (let q = 1; q <= 3; q++) {
          const qx = hrToX(h + q / 4);
          const tickH = q === 2 ? 8 : 5;
          ctx.strokeStyle = "#ccc";
          ctx.lineWidth = 0.35;
          ln(ctx, qx, ry, qx, ry + tickH);
          ln(ctx, qx, ry + ROW_H - tickH, qx, ry + ROW_H);
        }
      }
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// STATUS LINES  (dot → horizontal → vertical drop)
// ═════════════════════════════════════════════════════════════════════════════
function drawStatusLines(ctx, events) {
  if (!events) return;
  ctx.strokeStyle = "#1a52c8";
  ctx.fillStyle = "#1a52c8";
  ctx.lineWidth = 2.5;

  events.forEach((ev, idx) => {
    const rowY = ROW_Y[ev.status];
    if (rowY === undefined) return;

    const x1 = hrToX(ev.start_hour);
    const x2 = hrToX(ev.end_hour);
    const y = rowY + ROW_H / 2;

    // Dot
    ctx.beginPath();
    ctx.arc(x1, y, DOT_R, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x1 + DOT_R, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Brackets — clipped strictly to this row's rectangle
    if (ev.is_stationary) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(GRID_X, rowY, GRID_W, ROW_H);
      ctx.clip();
      drawBrackets(ctx, x1, x2, y);
      ctx.restore();
    }

    // Vertical drop to next event
    const next = events[idx + 1];
    if (next && ROW_Y[next.status] !== undefined) {
      const yNext = ROW_Y[next.status] + ROW_H / 2;
      ctx.beginPath();
      ctx.moveTo(x2, y);
      ctx.lineTo(x2, yNext);
      ctx.stroke();
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// BRACKETS
// ═════════════════════════════════════════════════════════════════════════════
function drawBrackets(ctx, x1, x2, lineY) {
  const bH = 10;
  ctx.strokeStyle = "#1a52c8";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x1, lineY);
  ctx.lineTo(x1, lineY - bH);
  ctx.lineTo(x1 + 7, lineY - bH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, lineY);
  ctx.lineTo(x2, lineY - bH);
  ctx.lineTo(x2 - 7, lineY - bH);
  ctx.stroke();
}

// ═════════════════════════════════════════════════════════════════════════════
// TOTALS
// ═════════════════════════════════════════════════════════════════════════════
function drawTotals(ctx, totals) {
  const tx = GRID_X + GRID_W + 2;
  const bw = 68;

  [
    ["offDuty", totals.offDuty],
    ["sleeperBerth", totals.sleeperBerth],
    ["driving", totals.driving],
    ["onDutyNotDriving", totals.onDutyNotDriving],
  ].forEach(([key, val]) => {
    const ry = ROW_Y[key];
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.8;
    bx(ctx, tx, ry + 2, bw, ROW_H - 4);
    const display = Number(val) === 0 ? "0" : Number(val).toFixed(2);
    txt(
      ctx,
      display,
      tx + bw / 2,
      ry + ROW_H / 2 + 5,
      "bold 13px Arial",
      "center",
    );
  });

  const sum = Object.values(totals).reduce((a, b) => a + Number(b), 0);
  const sumY = GRID_TOP_Y + ROW_H * 4 + 4;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.8;
  bx(ctx, tx, sumY, bw, 18);
  txt(ctx, sum.toFixed(2), tx + bw / 2, sumY + 13, "bold 11px Arial", "center");
}

// ═════════════════════════════════════════════════════════════════════════════
// BOTTOM RULER
// ═════════════════════════════════════════════════════════════════════════════
function drawBottomRuler(ctx) {
  const RY = GRID_TOP_Y + ROW_H * 4;
  const RH = 22;
  fbx(ctx, GRID_X, RY, GRID_W, RH, "#f8f8f4");
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  bx(ctx, GRID_X, RY, GRID_W, RH);
  drawRulerTicks(ctx, RY, RH, true);
}

// ═════════════════════════════════════════════════════════════════════════════
// REMARKS
// ═════════════════════════════════════════════════════════════════════════════
function drawRemarks(ctx, remarks) {
  const rulerBottom = GRID_TOP_Y + ROW_H * 4 + 22;
  const remarksAreaY = rulerBottom;
  const remarksAreaH = CANVAS_H - remarksAreaY - 2;

  fbx(ctx, 0, remarksAreaY, CANVAS_W, remarksAreaH, "#FAFAF6");
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  bx(ctx, 0, remarksAreaY, CANVAS_W, remarksAreaH);

  txt(ctx, "REMARKS", 6, remarksAreaY + 14, "bold 9px Arial", "left");

  // Horizontal divider line with hour ticks — labels sit ABOVE the line
  const dividerY = remarksAreaY + 22;
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ln(ctx, GRID_X, dividerY, GRID_X + GRID_W, dividerY);

  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h);
    const tickH = h % 6 === 0 ? 6 : 3;
    ctx.strokeStyle = h % 6 === 0 ? "#555" : "#aaa";
    ctx.lineWidth = h % 6 === 0 ? 0.7 : 0.35;
    ln(ctx, x, dividerY, x, dividerY + tickH);

    const label =
      h === 0 ? "Mid" : h === 24 ? "Mid" : h === 12 ? "Noon" : String(h);
    const font =
      h === 0 || h === 12 || h === 24 ? "bold 6.5px Arial" : "6.5px Arial";
    // Labels above the divider line — baseline 4px above it
    txt(ctx, label, x, dividerY - 4, font, "center", "#444");
  }

  if (!remarks || remarks.length === 0) return;

  const labelStartY = dividerY + 10;
  remarks.forEach((r) => {
    const timeParts = (r.time || "0:0").split(":");
    const hour = parseFloat(timeParts[0]) + parseFloat(timeParts[1] || 0) / 60;
    const x = hrToX(hour);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.8;
    ln(ctx, x, dividerY + 4, x, labelStartY);

    ctx.save();
    ctx.translate(x + 2, labelStartY);
    ctx.rotate(Math.PI / 3);
    ctx.font = "8px Arial";
    ctx.fillStyle = "#111";
    ctx.textAlign = "left";
    ctx.fillText(r.location || "", 0, 0);
    ctx.restore();
  });
}
