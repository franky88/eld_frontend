import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { useTripStore, saveDraft, loadDraft, clearDraft } from "../store";
import MapView from "../components/MapView";
import LogSheet from "../components/LogSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  Navigation,
  Package,
  MapPin,
  Clock,
  Route,
  FileText,
  Milestone,
  Calendar,
  TrendingUp,
  AlertCircle,
  Save,
  FolderOpen,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Info,
  Loader2,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

// ── Geocode autocomplete hook ──────────────────────────────────────────────
function useGeocode() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = (q) => {
    clearTimeout(timer.current);
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API}/api/geocode/?q=${encodeURIComponent(q)}`,
        );
        setSuggestions(res.data.features || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const clear = () => setSuggestions([]);
  return { suggestions, loading, search, clear };
}

// ── Location field with dropdown ───────────────────────────────────────────
function LocationField({
  label,
  hint,
  icon: Icon,
  value,
  onChange,
  error,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || "");
  const [confirmed, setConfirmed] = useState(false);
  const { suggestions, loading, search, clear } = useGeocode();
  const wrapRef = useRef(null);

  useEffect(() => {
    setInputVal(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    setConfirmed(false);
    onChange(v);
    search(v);
    setOpen(true);
  };

  const handleSelect = (label) => {
    setInputVal(label);
    setConfirmed(true);
    onChange(label);
    clear();
    setOpen(false);
  };

  const showDropdown = open && (loading || suggestions.length > 0);

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <input
          type="text"
          value={inputVal}
          onChange={handleInput}
          onFocus={() => inputVal.length >= 3 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-9 px-3 pr-8 rounded-md border text-sm bg-background
            placeholder:text-muted-foreground/50 transition-colors
            focus:outline-none focus:ring-2 focus:ring-ring
            ${error ? "border-destructive" : confirmed ? "border-green-500" : "border-input"}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : confirmed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
              </div>
            )}
            {!loading &&
              suggestions.map((f, i) => {
                const lbl = f.properties?.label || "";
                const region =
                  f.properties?.region || f.properties?.country || "";
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => handleSelect(lbl)}
                    className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-secondary transition-colors border-b border-border/10 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm">{lbl}</p>
                      {region && (
                        <p className="text-xs text-muted-foreground">
                          {region}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            {!loading && suggestions.length === 0 && inputVal.length >= 3 && (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No results — try "City, State"
              </div>
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Home() {
  const { result, loading, error, setResult, setLoading, setError, reset } =
    useTripStore();
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(!!loadDraft());
  const [logsOpen, setLogsOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);
  const resultsRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset: resetForm,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const cycleVal = parseFloat(watch("cycle_used_hours") || 0);
  const cycleValid = !isNaN(cycleVal) && cycleVal >= 0 && cycleVal <= 70;
  const cyclePct = cycleValid ? Math.round((cycleVal / 70) * 100) : 0;
  const cycleColor =
    cyclePct >= 86
      ? "bg-destructive"
      : cyclePct >= 64
        ? "bg-amber-500"
        : "bg-primary";

  // Watch all fields for payload preview + draft save
  const watchAll = watch();

  // Live payload preview
  const payload = {
    current_location: watchAll.current_location || "",
    pickup_location: watchAll.pickup_location || "",
    dropoff_location: watchAll.dropoff_location || "",
    cycle_used_hours:
      watchAll.cycle_used_hours !== ""
        ? parseFloat(watchAll.cycle_used_hours) || null
        : null,
    ...(watchAll.carrier ? { carrier: watchAll.carrier } : {}),
  };

  const handleSaveDraft = () => {
    saveDraft(watchAll);
    setDraftSaved(true);
    setHasDraft(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleLoadDraft = () => {
    const draft = loadDraft();
    if (!draft) return;
    resetForm(draft);
  };

  const handleReset = () => {
    resetForm();
    reset();
    clearDraft();
    setHasDraft(false);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/api/plan-trip/`, {
        current_location: data.current_location,
        pickup_location: data.pickup_location,
        dropoff_location: data.dropoff_location,
        cycle_used_hours: parseFloat(data.cycle_used_hours),
        carrier: data.carrier || "",
        main_office: data.main_office || "",
        tractor_number: data.tractor_number || "",
        trailer_number: data.trailer_number || "",
        driver_signature: data.driver_signature || "",
      });
      setResult(res.data);
      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const totalDriving = result
    ? result.logs.reduce((s, d) => s + Number(d.totals.driving), 0)
    : 0;
  const totalOnDuty = result
    ? result.logs.reduce((s, d) => s + Number(d.totals.onDutyNotDriving), 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/10 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <p className="font-semibold text-sm leading-tight">
                ELD Trip Planner
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                FMCSA 49 CFR Part 395
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs gap-1.5 hidden sm:flex"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </Badge>
          </div>
        </div>
      </header>

      {/* ── Stepper ── */}
      <div className="bg-secondary/30 border-b border-border/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-0">
          {[
            { n: 1, label: "Trip details", done: !!result },
            { n: 2, label: "Review route", done: !!result },
            { n: 3, label: "Download logs", done: false },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center justify-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                  ${s.done ? "bg-emerald-500 text-white" : !result && s.n === 1 ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground"}`}
                >
                  {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${s.done || (!result && s.n === 1) ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </div>
              {/* {i < 2 && <div className="flex-1 h-px bg-border mx-3" />} */}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
          {/* ══ LEFT PANEL — Form ══ */}
          <div className="space-y-4">
            {/* Draft bar */}
            {hasDraft && (
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Saved draft available
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-amber-700 dark:text-amber-400 px-2"
                  onClick={handleLoadDraft}
                >
                  <FolderOpen className="w-3 h-3 mr-1" /> Load
                </Button>
              </div>
            )}

            {/* ── Section: Route ── */}
            <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10">
                <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Route className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Route</p>
                  <p className="text-xs text-muted-foreground">
                    Geocoded via OpenRouteService
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <Controller
                  name="current_location"
                  control={control}
                  rules={{ required: "Current location is required" }}
                  render={({ field }) => (
                    <LocationField
                      label="Current Location"
                      placeholder="e.g. Chicago, IL"
                      hint="Where the truck is right now — route origin"
                      icon={Navigation}
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.current_location?.message}
                    />
                  )}
                />

                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> stops in order
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                <Controller
                  name="pickup_location"
                  control={control}
                  rules={{ required: "Pickup location is required" }}
                  render={({ field }) => (
                    <LocationField
                      label="Pickup Location"
                      placeholder="e.g. Indianapolis, IN"
                      hint="1 hr on-duty (not driving) auto-logged at this stop"
                      icon={Package}
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.pickup_location?.message}
                    />
                  )}
                />

                <Controller
                  name="dropoff_location"
                  control={control}
                  rules={{ required: "Dropoff location is required" }}
                  render={({ field }) => (
                    <LocationField
                      label="Dropoff Location"
                      placeholder="e.g. Nashville, TN"
                      hint="1 hr on-duty (not driving) auto-logged at this stop"
                      icon={MapPin}
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.dropoff_location?.message}
                    />
                  )}
                />

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900 mt-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed text-start">
                    Fuel stops auto-inserted every 1,000 mi. Pre-trip inspection
                    (30 min) added at start of every driving day.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section: HOS ── */}
            <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10">
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Hours of Service</p>
                  <p className="text-xs text-muted-foreground">
                    FMCSA 49 CFR Part 395
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Locked cycle rule */}
                <div className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg border border-border/10">
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium">
                      70 hrs / 8 days property carrier
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fixed · validated server-side
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Lock className="w-2.5 h-2.5" /> locked
                  </Badge>
                </div>

                {/* Cycle hours input */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cycle_used"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Hours used in current 8-day cycle{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cycle_used"
                    type="number"
                    placeholder="e.g. 14.5"
                    step="0.5"
                    min={0}
                    max={70}
                    className={`h-9 text-sm max-w-full ${errors.cycle_used_hours ? "border-destructive" : ""}`}
                    {...register("cycle_used_hours", {
                      required: "Required",
                      min: { value: 0, message: "Min 0" },
                      max: { value: 70, message: "Max 70" },
                    })}
                  />
                  {errors.cycle_used_hours ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.cycle_used_hours.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Range: 0 – 70 hrs
                    </p>
                  )}
                </div>

                {/* Cycle bar */}
                {cycleValid &&
                  watchAll.cycle_used_hours !== "" &&
                  watchAll.cycle_used_hours !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cycleVal.toFixed(1)} hrs used</span>
                        <span>{(70 - cycleVal).toFixed(1)} hrs remaining</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${cycleColor}`}
                          style={{ width: `${cyclePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground/60">
                        <span>0</span>
                        <span>70 hrs</span>
                      </div>
                    </div>
                  )}

                {/* HOS rules grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { icon: Truck, val: "11 hrs", label: "Max driving" },
                    { icon: Clock, val: "14 hrs", label: "On-duty window" },
                    {
                      icon: TrendingUp,
                      val: "10 hrs",
                      label: "Off-duty reset",
                    },
                    {
                      icon: Calendar,
                      val: "30 min",
                      label: "Break after 8 hrs",
                    },
                  ].map(({ icon: Icon, val, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 p-2.5 bg-secondary/40 rounded-lg"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex flex-col items-start">
                        <p className="text-xs font-semibold">{val}</p>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Section: Log Sheet Details ── */}
            <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10">
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Log Sheet Details</p>
                  <p className="text-xs text-muted-foreground">
                    Printed on each Driver's Daily Log (optional)
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Carrier / Company
                    </Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="e.g. FastHaul Logistics"
                      {...register("carrier")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Main Office Address
                    </Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="City, State"
                      {...register("main_office")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Tractor #
                    </Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="TRK-204"
                      {...register("tractor_number")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Trailer #
                    </Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="TRL-089"
                      {...register("trailer_number")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Driver Signature
                    </Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="Full name"
                      {...register("driver_signature")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: Payload Preview ── */}
            {/* <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60">
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Request Payload</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    POST /api/plan-trip/
                  </p>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono text-muted-foreground bg-secondary/50 rounded-lg p-3 overflow-auto leading-relaxed">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </div> */}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Footer buttons ── */}
            <div className="flex items-center justify-between gap-2 sticky bottom-4 bg-white/95 backdrop-blur py-3 px-4 border border-border/10 rounded-lg">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className={`gap-1.5 text-xs transition-colors ${draftSaved ? "border-emerald-500 text-emerald-600" : ""}`}
                >
                  {draftSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save draft
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="gap-2 font-semibold shadow-sm"
                size="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Planning…
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4" /> Plan route
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ══ RIGHT PANEL — Results ══ */}
          <div className="space-y-4" ref={resultsRef}>
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Truck className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-muted-foreground">
                  No trip planned yet
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                  Fill in the trip details on the left and click "Plan route" to
                  generate your route map and HOS logs.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Truck className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Planning your route…</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculating HOS compliance & generating log sheets
                  </p>
                </div>
              </div>
            )}

            {!loading && result && (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      icon: Milestone,
                      label: "Total Miles",
                      value: result.route.total_miles.toFixed(1),
                      unit: "mi",
                      color: "text-blue-600",
                    },
                    {
                      icon: Calendar,
                      label: "Trip Days",
                      value: result.logs.length,
                      unit: "days",
                      color: "text-violet-600",
                    },
                    {
                      icon: Clock,
                      label: "Drive Time",
                      value: totalDriving.toFixed(1),
                      unit: "hrs",
                      color: "text-emerald-600",
                    },
                    {
                      icon: TrendingUp,
                      label: "On Duty",
                      value: totalOnDuty.toFixed(1),
                      unit: "hrs",
                      color: "text-amber-600",
                    },
                  ].map(({ icon: Icon, label, value, unit, color }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border/10 bg-card p-4 shadow-sm flex flex-col items-start gap-1"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-xs text-muted-foreground">
                          {label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Map */}
                <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-border/10 hover:bg-secondary/30 transition-colors"
                    onClick={() => setMapOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                        <Route className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Route Map</p>
                        <p className="text-xs text-muted-foreground">
                          {result.route.stops.length} stops ·{" "}
                          {result.route.total_miles.toFixed(1)} mi
                        </p>
                      </div>
                    </div>
                    {mapOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {mapOpen && (
                    <div className="p-4">
                      <MapView route={result.route} />
                    </div>
                  )}
                </div>

                {/* Logs */}
                <div className="rounded-xl border border-border/10 bg-card shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-border/10 hover:bg-secondary/30 transition-colors"
                    onClick={() => setLogsOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          Driver's Daily Logs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.logs.length}{" "}
                          {result.logs.length === 1 ? "sheet" : "sheets"} ·
                          click to expand
                        </p>
                      </div>
                    </div>
                    {logsOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {logsOpen && (
                    <div className="p-4">
                      <LogSheet logs={result.logs} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
