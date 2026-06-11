import { useRef, useEffect } from "react";
import { useTripStore } from "../store";
import { drawLogSheet, CANVAS_W, CANVAS_H } from "../utils/drawLogSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, MapPin, Clock } from "lucide-react";
import { jsPDF } from "jspdf";

export default function LogSheet({ logs }) {
  const { activeDay, setActiveDay } = useTripStore();
  const canvasRefs = useRef([]);

  useEffect(() => {
    if (!logs) return;
    logs.forEach((log, i) => {
      const canvas = canvasRefs.current[i];
      if (!canvas) return;
      drawLogSheet(canvas.getContext("2d"), log);
    });
  }, [logs]);

  const exportPDF = () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [CANVAS_W, CANVAS_H],
    });
    logs.forEach((_, i) => {
      const canvas = canvasRefs.current[i];
      if (!canvas) return;
      if (i > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        CANVAS_W,
        CANVAS_H,
      );
    });
    pdf.save("eld-trip-logs.pdf");
  };

  const activeLog = logs[activeDay];

  return (
    <div className="space-y-3">
      {/* Day tabs + export */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {logs.map((log, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${
                  activeDay === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              <Calendar className="w-3 h-3" />
              Day {log.day}
              <span
                className={`${activeDay === i ? "opacity-70" : "text-muted-foreground"}`}
              >
                {log.fields.date}
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={exportPDF}
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
        >
          <Download className="w-3.5 h-3.5" />
          PDF ({logs.length} {logs.length === 1 ? "day" : "days"})
        </Button>
      </div>

      {/* Day stats */}
      {activeLog && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: MapPin,
              label: "Miles",
              value: `${activeLog.fields.total_miles} mi`,
            },
            {
              icon: Clock,
              label: "Driving",
              value: `${activeLog.totals.driving} hrs`,
            },
            {
              icon: Calendar,
              label: "On Duty",
              value: `${activeLog.totals.onDutyNotDriving} hrs`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-secondary/50 rounded-lg px-3 py-2 text-center"
            >
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
                <Icon className="w-3 h-3" />
                {label}
              </p>
              <p className="text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm">
        {logs.map((_, i) => (
          <canvas
            key={i}
            ref={(el) => (canvasRefs.current[i] = el)}
            width={CANVAS_W}
            height={CANVAS_H}
            className={`w-full ${i === activeDay ? "block" : "hidden"}`}
          />
        ))}
      </div>

      {/* Remarks */}
      {activeLog?.remarks?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Remarks
          </p>
          {activeLog.remarks.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-xs py-1.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <span className="font-mono font-semibold text-primary shrink-0">
                {r.time}
              </span>
              <span className="text-muted-foreground shrink-0 truncate max-w-40">
                {r.location}
              </span>
              <span className="text-foreground">{r.activity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
