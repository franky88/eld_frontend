// ── Canvas dimensions ─────────────────────────────────────────────────────────
export const CANVAS_W = 1100;
export const CANVAS_H = 620;

// ── Grid geometry ─────────────────────────────────────────────────────────────
export const GRID_X = 100; // left edge of 24-hr grid
export const GRID_W = 860; // total width = 24 hours
export const GRID_TOP_Y = 228; // top of first status row (after top ruler)
export const ROW_H = 42; // height of each status row
export const DOT_R = 3.5;

// ── Row Y positions (top edge of each row) ────────────────────────────────────
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
// HEADER  (rows 1-4 above the grid)
// ═════════════════════════════════════════════════════════════════════════════
function drawHeader(ctx, f) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;

  const W = CANVAS_W;
  const PAD = 6;

  // ── Row 0: top banner ──────────────────────────────────────────────────────
  fbx(ctx, 0, 0, W, 18, "#f0f0f0");
  bx(ctx, 0, 0, W, 18);
  txt(
    ctx,
    "U.S. DEPARTMENT OF TRANSPORTATION",
    PAD,
    13,
    "bold 9px Arial",
    "left",
  );
  txt(ctx, "DRIVER'S DAILY LOG", W / 2, 13, "bold 13px Arial", "center");
  txt(
    ctx,
    "(ONE CALENDAR DAY — 24 HOURS)",
    W / 2,
    24,
    "8px Arial",
    "center",
    "#333",
  );
  txt(
    ctx,
    "ORIGINAL — Submit to carrier within 13 days",
    W - PAD,
    10,
    "7.5px Arial",
    "right",
    "#333",
  );
  txt(
    ctx,
    "DUPLICATE — Driver retains possession for eight days",
    W - PAD,
    20,
    "7.5px Arial",
    "right",
    "#333",
  );

  // ── Row 1: Date | Miles | Signature | Vehicle ──────────────────────────────
  // FIX (purple rect): increased R1H from 48 → 56 so text doesn't crowd the
  // bottom border line; sub-labels now sit at R1Y+50 with comfortable padding.
  const R1Y = 18,
    R1H = 56;
  bx(ctx, 0, R1Y, W, R1H);

  // Date section (left ~220px)
  bx(ctx, 0, R1Y, 220, R1H);
  const dp = (f.date || "--  --  ----").split("-");
  const mo = dp[1] || "--",
    dy = dp[2] || "--",
    yr = dp[0] || "----";
  txt(ctx, mo, 40, R1Y + 30, "bold 22px Arial", "center");
  txt(ctx, dy, 90, R1Y + 30, "bold 22px Arial", "center");
  txt(ctx, yr, 165, R1Y + 30, "bold 22px Arial", "center");
  // Sub-labels pushed down away from the large numbers
  txt(ctx, "(MONTH)", 40, R1Y + 50, "7px Arial", "center", "#555");
  txt(ctx, "(DAY)", 90, R1Y + 50, "7px Arial", "center", "#555");
  txt(ctx, "(YEAR)", 165, R1Y + 50, "7px Arial", "center", "#555");
  ctx.lineWidth = 0.6;
  ln(ctx, 60, R1Y, 60, R1Y + R1H);
  ln(ctx, 115, R1Y, 115, R1Y + R1H);
  ctx.lineWidth = 1;

  // Miles section
  bx(ctx, 220, R1Y, 200, R1H);
  txt(
    ctx,
    String(f.total_miles ?? "0"),
    320,
    R1Y + 30,
    "bold 22px Arial",
    "center",
  );
  txt(
    ctx,
    "(TOTAL MILES DRIVING TODAY)",
    320,
    R1Y + 50,
    "7px Arial",
    "center",
    "#555",
  );

  // FIX (purple rect): Signature section — certification text now on its own
  // line well above the signature, with extra vertical room so neither
  // overlaps the cell borders.
  bx(ctx, 420, R1Y, 300, R1H);
  txt(
    ctx,
    "I certify that these entries are true and correct",
    570,
    R1Y + 14,
    "italic 7.5px Arial",
    "center",
    "#333",
  );
  // Signature text vertically centred in the lower half of the cell
  txt(
    ctx,
    f.driver_signature || "Driver",
    570,
    R1Y + 40,
    "bold italic 18px Arial",
    "center",
  );

  // FIX (purple rect): Vehicle numbers section — label pushed down so it
  // doesn't sit on top of the bottom border.
  bx(ctx, 720, R1Y, W - 720, R1H);
  txt(
    ctx,
    f.tractor_number && f.tractor_number !== "N/A"
      ? f.tractor_number
      : "123, 45678",
    850,
    R1Y + 30,
    "bold 20px Arial",
    "center",
  );
  txt(
    ctx,
    "VEHICLE NUMBERS — (SHOW EACH UNIT)",
    850,
    R1Y + 50,
    "7px Arial",
    "center",
    "#555",
  );

  // ── Row 2: Carrier | Co-driver ─────────────────────────────────────────────
  const R2Y = R1Y + R1H,
    R2H = 42;
  bx(ctx, 0, R2Y, W, R2H);

  bx(ctx, 0, R2Y, 420, R2H);
  txt(
    ctx,
    f.carrier && f.carrier !== "N/A" ? f.carrier : "Independent Carrier",
    210,
    R2Y + 20,
    "bold italic 15px Arial",
    "center",
  );
  txt(
    ctx,
    "(NAME OF CARRIER OR CARRIERS)",
    210,
    R2Y + 35,
    "7px Arial",
    "center",
    "#555",
  );

  bx(ctx, 420, R2Y, W - 420, R2H);
  txt(
    ctx,
    f.driver_signature || "Driver",
    660,
    R2Y + 20,
    "bold italic 14px Arial",
    "center",
  );
  txt(
    ctx,
    "(DRIVER'S SIGNATURE IN FULL)",
    590,
    R2Y + 35,
    "7px Arial",
    "center",
    "#555",
  );
  txt(ctx, "—", 860, R2Y + 20, "12px Arial", "center");
  txt(ctx, "(NAME OF CO_DRIVER)", 860, R2Y + 35, "7px Arial", "center", "#555");

  // ── Row 3: Main office | TOTAL HOURS label ─────────────────────────────────
  const R3Y = R2Y + R2H,
    R3H = 36;
  bx(ctx, 0, R3Y, W, R3H);

  bx(ctx, 0, R3Y, 420, R3H);
  txt(
    ctx,
    f.home_terminal || "Home Terminal",
    210,
    R3Y + 16,
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
  // TOTAL HOURS label at far right above totals column
  const totX = GRID_X + GRID_W;
  txt(ctx, "TOTAL", totX + 34, R3Y + 14, "bold 8px Arial", "center");
  txt(ctx, "HOURS", totX + 34, R3Y + 24, "bold 8px Arial", "center");
}

// ═════════════════════════════════════════════════════════════════════════════
// TOP RULER  (hour labels + tick marks above the grid)
// ═════════════════════════════════════════════════════════════════════════════
function drawTopRuler(ctx) {
  const RY = 204; // top of ruler band
  const RH = 24; // height of ruler band

  fbx(ctx, GRID_X, RY, GRID_W, RH, "#f8f8f4");
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;

  // Row labels on left (vertically centered to each grid row)
  const labels = [
    ["Off", "Duty"],
    ["Sleeper", "Berth"],
    ["Driving", null],
    ["On Duty", "(Not\nDriving)"],
  ];
  const rowKeys = Object.keys(ROW_Y);
  rowKeys.forEach((k, i) => {
    const ry = ROW_Y[k];
    ctx.font = "bold 8.5px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    const lns = labels[i];
    if (!lns[1]) {
      ctx.fillText(lns[0], GRID_X - 4, ry + ROW_H / 2 + 3);
    } else if (lns[1].includes("\n")) {
      const parts = lns[1].split("\n");
      ctx.fillText(lns[0], GRID_X - 4, ry + ROW_H / 2 - 8);
      ctx.font = "7.5px Arial";
      ctx.fillText(parts[0], GRID_X - 4, ry + ROW_H / 2 + 2);
      ctx.fillText(parts[1], GRID_X - 4, ry + ROW_H / 2 + 11);
    } else {
      ctx.fillText(lns[0], GRID_X - 4, ry + ROW_H / 2 - 3);
      ctx.font = "7.5px Arial";
      ctx.fillText(lns[1], GRID_X - 4, ry + ROW_H / 2 + 8);
    }
  });

  drawRulerTicks(ctx, RY, RH, true);
}

// ═════════════════════════════════════════════════════════════════════════════
// RULER TICKS  (shared by top + bottom rulers)
// ═════════════════════════════════════════════════════════════════════════════
function drawRulerTicks(ctx, rulerY, rulerH, showLabels) {
  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h);

    ctx.strokeStyle = "#555";
    ctx.lineWidth = h % 6 === 0 ? 1 : 0.6;

    if (h < 24) {
      for (let q = 1; q <= 3; q++) {
        const qx = hrToX(h + q / 4);
        const tickH = q === 2 ? rulerH * 0.55 : rulerH * 0.35;
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 0.4;
      }
    }

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
// GRID  (4 status rows + internal tick marks)
// ═════════════════════════════════════════════════════════════════════════════
function drawGrid(ctx) {
  // Row backgrounds (alternating very subtle tint)
  Object.values(ROW_Y).forEach((ry, i) => {
    fbx(ctx, GRID_X, ry, GRID_W, ROW_H, i % 2 === 0 ? "#FAFAF6" : "#F4F4EE");
  });

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  bx(ctx, GRID_X, GRID_TOP_Y, GRID_W, ROW_H * 4);

  // Internal grid lines
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

    // FIX (red rect): brackets must be clipped to the row so they never
    // draw lines outside the row boundary. Save/restore keeps the clip local.
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
// BRACKETS  (above stationary on-duty events — clipped to row by caller)
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
// TOTALS  (right of grid — boxed hours per row + sum)
// ═════════════════════════════════════════════════════════════════════════════
function drawTotals(ctx, totals) {
  const tx = GRID_X + GRID_W + 2;
  const bw = 68;

  const rows = [
    ["offDuty", totals.offDuty],
    ["sleeperBerth", totals.sleeperBerth],
    ["driving", totals.driving],
    ["onDutyNotDriving", totals.onDutyNotDriving],
  ];

  rows.forEach(([key, val]) => {
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

  // FIX (green rect): removed "=" prefix — show just the numeric sum.
  const sum = Object.values(totals).reduce((a, b) => a + Number(b), 0);
  const sumY = GRID_TOP_Y + ROW_H * 4 + 4;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.8;
  bx(ctx, tx, sumY, bw, 18);
  txt(ctx, sum.toFixed(2), tx + bw / 2, sumY + 13, "bold 11px Arial", "center");
}

// ═════════════════════════════════════════════════════════════════════════════
// BOTTOM RULER  (below grid, mirror of top)
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
// REMARKS  (location labels + horizontal divider line below ruler)
// ═════════════════════════════════════════════════════════════════════════════
function drawRemarks(ctx, remarks) {
  const rulerBottom = GRID_TOP_Y + ROW_H * 4 + 22;
  const remarksAreaY = rulerBottom;
  const remarksAreaH = CANVAS_H - remarksAreaY - 2;

  fbx(ctx, 0, remarksAreaY, CANVAS_W, remarksAreaH, "#FAFAF6");
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  bx(ctx, 0, remarksAreaY, CANVAS_W, remarksAreaH);

  // "REMARKS" label
  txt(ctx, "REMARKS", 6, remarksAreaY + 14, "bold 9px Arial", "left");

  // ── FIX (green rect): replaced the small inner tick strip with a clean
  //    horizontal rule that matches the grid width.  No extra ruler box is
  //    drawn — just a single line — so nothing overlaps the diagonal labels. ──
  const dividerY = remarksAreaY + 20;
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  ln(ctx, GRID_X, dividerY, GRID_X + GRID_W, dividerY);

  // Hour reference ticks along the divider (lightweight, no box)
  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h);
    const tickH = h % 6 === 0 ? 6 : 3;
    ctx.strokeStyle = h % 6 === 0 ? "#555" : "#aaa";
    ctx.lineWidth = h % 6 === 0 ? 0.7 : 0.35;
    ln(ctx, x, dividerY, x, dividerY + tickH);

    // ── FIX (green rect): hour labels drawn ABOVE the divider line (inside
    //    the divider strip) so they don't overlap the diagonal remark text. ──
    const label =
      h === 0 ? "Mid" : h === 24 ? "Mid" : h === 12 ? "Noon" : String(h);
    const font =
      h === 0 || h === 12 || h === 24 ? "bold 6.5px Arial" : "6.5px Arial";
    txt(ctx, label, x, dividerY - 3, font, "center", "#444");
  }

  // Diagonal location labels below the divider
  if (!remarks || remarks.length === 0) return;

  const labelStartY = dividerY + 8;

  remarks.forEach((r) => {
    const timeParts = (r.time || "0:0").split(":");
    const hour = parseFloat(timeParts[0]) + parseFloat(timeParts[1] || 0) / 60;
    const x = hrToX(hour);

    // Short vertical stem from divider down to the text start
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.8;
    ln(ctx, x, dividerY + tickStemH(r), x, labelStartY);

    ctx.save();
    ctx.translate(x + 2, labelStartY);
    ctx.rotate(Math.PI / 3); // ~60 degrees
    ctx.font = "8px Arial";
    ctx.fillStyle = "#111";
    ctx.textAlign = "left";
    ctx.fillText(r.location || "", 0, 0);
    ctx.restore();
  });
}

// tiny helper — keep stem height consistent
function tickStemH(_r) {
  return 4;
}
