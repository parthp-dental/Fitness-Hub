import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { db, UID } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

// ── Constants ────────────────────────────────────────────────────────────────

const TARGETS = { kcal: 1950, protein: 134, carbs: 230, fat: 55 };

const MEALS = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅", time: "7:00am", kcal: 362, protein: 50, carbs: 24, fat: 7,
    items: [
      { name: "Actimel Original 100ml", kcal: 73, protein: 3, carbs: 11, fat: 1.5 },
      { name: "ASDA Greek Yogurt 100g", kcal: 66, protein: 7, carbs: 8, fat: 0.5 },
      { name: "Soya Protein Crispies 30g", kcal: 109, protein: 22.5, carbs: 2.3, fat: 0.7 },
      { name: "Blueberries x5", kcal: 5, protein: 0, carbs: 1, fat: 0 },
      { name: "Myprotein Whey Shake 25g", kcal: 109, protein: 17, carbs: 1.2, fat: 4 },
    ],
  },
  { id: "lunch", label: "Lunch", emoji: "☀️", time: "1:00pm", kcal: 541, protein: 41, carbs: 46, fat: 17,
    items: [
      { name: "Chickpeas 150g (cooked)", kcal: 206, protein: 13, carbs: 26, fat: 4 },
      { name: "Edamame Beans 100g", kcal: 155, protein: 12, carbs: 6.5, fat: 7.6 },
      { name: "LM Vegan Sausages x2", kcal: 130, protein: 13, carbs: 5, fat: 5 },
      { name: "Mixed Veg 150g", kcal: 50, protein: 3, carbs: 8, fat: 0.5 },
    ],
  },
  { id: "dinner", label: "Dinner", emoji: "🌙", time: "6:00pm", kcal: 831, protein: 57, carbs: 72, fat: 47,
    items: [
      { name: "2 Rotlis (Aashirvaad atta)", kcal: 170, protein: 5.5, carbs: 36.5, fat: 0.7 },
      { name: "Apetina Paneer 100g", kcal: 174, protein: 22, carbs: 3.2, fat: 8 },
      { name: "Mixed salad veg", kcal: 15, protein: 1, carbs: 3, fat: 0 },
      { name: "Green chutney + chilli sauce", kcal: 45, protein: 0.5, carbs: 9, fat: 0 },
      { name: "Nasto 30g", kcal: 143, protein: 2, carbs: 17, fat: 7 },
      { name: "KP Roasted Peanuts 30g", kcal: 177, protein: 8.5, carbs: 3.4, fat: 13.8 },
      { name: "Myprotein Whey Shake 25g", kcal: 109, protein: 17, carbs: 1.2, fat: 4 },
    ],
  },
];

const FOOD_DB = [
  { name: "Banana (medium)", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Apple (medium)", kcal: 72, protein: 0.4, carbs: 19, fat: 0.2 },
  { name: "Orange (medium)", kcal: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { name: "Mango 100g", kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: "Greek Yogurt 100g", kcal: 66, protein: 7, carbs: 8, fat: 0.5 },
  { name: "Whole Milk 200ml", kcal: 130, protein: 6.8, carbs: 9.4, fat: 7.4 },
  { name: "Egg (large)", kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: "Paneer 100g", kcal: 174, protein: 22, carbs: 3.2, fat: 8 },
  { name: "Tofu 100g", kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: "Chickpeas 100g (cooked)", kcal: 148, protein: 8, carbs: 18, fat: 3 },
  { name: "Lentils 100g (cooked)", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Edamame 100g", kcal: 155, protein: 12, carbs: 6.5, fat: 7.6 },
  { name: "Oats 100g (dry)", kcal: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Brown Rice 100g (cooked)", kcal: 112, protein: 2.3, carbs: 24, fat: 0.8 },
  { name: "White Rice 100g (cooked)", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Wholemeal Bread (slice)", kcal: 78, protein: 3.5, carbs: 14, fat: 1 },
  { name: "Pasta 100g (cooked)", kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: "Rotli (1 medium)", kcal: 85, protein: 2.8, carbs: 17, fat: 0.7 },
  { name: "Chapati (1 medium)", kcal: 80, protein: 2.5, carbs: 15, fat: 1 },
  { name: "Naan (1 medium)", kcal: 262, protein: 8.7, carbs: 45, fat: 5.1 },
  { name: "Peanut Butter 1 tbsp", kcal: 94, protein: 4, carbs: 3.1, fat: 8 },
  { name: "Almonds 30g", kcal: 173, protein: 6.3, carbs: 6, fat: 15 },
  { name: "Sweet Potato 100g", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Broccoli 100g", kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Spinach 100g", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Dal 100g (cooked)", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Biryani 200g", kcal: 320, protein: 18, carbs: 42, fat: 8 },
  { name: "Samosa (1)", kcal: 150, protein: 3, carbs: 18, fat: 8 },
  { name: "Pizza slice (margherita)", kcal: 250, protein: 10, carbs: 32, fat: 9 },
  { name: "Whey Protein 25g", kcal: 109, protein: 17, carbs: 1.2, fat: 4 },
  { name: "Protein Bar (avg)", kcal: 200, protein: 20, carbs: 22, fat: 7 },
  { name: "KP Peanuts 30g", kcal: 177, protein: 8.5, carbs: 3.4, fat: 13.8 },
  { name: "Nasto mix 30g", kcal: 143, protein: 2, carbs: 17, fat: 7 },
  { name: "Actimel 100ml", kcal: 73, protein: 3, carbs: 11, fat: 1.5 },
  { name: "Coffee (black)", kcal: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: "Orange Juice 200ml", kcal: 84, protein: 1.2, carbs: 20, fat: 0.2 },
];

const SUPPLEMENTS = [
  { id: "vitd", label: "Vitamin D", time: "Morning", emoji: "☀️", color: "#f59e0b" },
  { id: "iq", label: "IQ Supplement", time: "Morning", emoji: "🧠", color: "#3b82f6" },
  { id: "ashwa", label: "Ashwagandha KSM-66", time: "With Dinner", emoji: "🌿", color: "#22c55e" },
  { id: "mag", label: "Magnesium Glycinate", time: "Before Bed", emoji: "😴", color: "#a855f7" },
];

const PLAN_DETAIL = [
  { id: "b", label: "Breakfast", emoji: "🌅", time: "7:00am", kcal: 362, protein: 50, carbs: 24, fat: 7,
    prep: "Layer yoghurt in bowl, top with crispies + blueberries. Shake whey separately. 2 mins.",
    ingredients: ["1 Actimel Original (100ml)", "100g ASDA Fat Free Greek Yogurt", "30g Soya Protein Cocoa Crispies", "5 blueberries", "25g Myprotein Essential Whey + 300ml water"] },
  { id: "l", label: "Lunch", emoji: "☀️", time: "1:00pm", kcal: 541, protein: 41, carbs: 46, fat: 17,
    prep: "Chickpeas boiled by mum. Boil edamame 2 mins. Fry sausages. Combine with spices. 10 mins.",
    ingredients: ["150g chickpeas cooked (white Mon/Wed/Fri — desi Tue/Thu/Sat)", "100g ASDA Edamame Soya Beans", "2 Linda McCartney Vegan Sausages", "150g mixed veg", "Cumin + chilli"] },
  { id: "d", label: "Dinner", emoji: "🌙", time: "6:00pm", kcal: 831, protein: 57, carbs: 72, fat: 47,
    prep: "Grill paneer until golden. Assemble rotlis with veg + sauces. Weigh nasto + peanuts. Shake whey.",
    ingredients: ["2 homemade rotlis (Aashirvaad atta ~25g each)", "100g Apetina Paneer (grilled)", "Mixed salad veg", "Green chutney + sweet chilli sauce", "30g Nasto (weighed)", "30g KP Roasted Peanuts (weighed)", "25g Myprotein Essential Whey"] },
];

const GYM_EXERCISES = {
  "Chest": ["Bench Press", "Incline Bench Press", "Decline Bench Press", "Chest Flyes", "Cable Crossover", "Dips"],
  "Back": ["Deadlift", "Barbell Row", "Lat Pulldown", "Cable Row", "T-Bar Row", "Seated Row"],
  "Shoulders": ["Overhead Press", "Lateral Raises", "Front Raises", "Rear Delt Flyes", "Arnold Press", "Shrugs"],
  "Arms": ["Bicep Curl", "Hammer Curl", "Tricep Pushdown", "Skull Crushers", "Preacher Curl", "Tricep Dips"],
  "Legs": ["Squat", "Leg Press", "Romanian Deadlift", "Leg Curl", "Leg Extension", "Calf Raises", "Lunges"],
  "Core": ["Plank", "Cable Crunches", "Leg Raises", "Russian Twist", "Ab Wheel"],
};

const BW_EXERCISES = {
  "Push": ["Push Ups", "Wide Push Ups", "Diamond Push Ups", "Pike Push Ups", "Dips"],
  "Pull": ["Pull Ups", "Chin Ups", "Inverted Rows"],
  "Legs": ["Squats", "Lunges", "Jump Squats", "Glute Bridges", "Calf Raises"],
  "Core": ["Plank", "Crunches", "Leg Raises", "Mountain Climbers", "Burpees"],
};

const CARDIO_TYPES = ["Treadmill", "Cross Trainer", "Cycling", "Rowing", "Running (outdoor)", "HIIT", "Swimming"];

// ── Helpers ──────────────────────────────────────────────────────────────────

const getToday = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; } };
const dayLabel = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" }); } catch { return d; } };

const compress = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Read failed"));
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Image failed"));
    img.onload = () => {
      try {
        const maxW = 480;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch (err) { reject(err); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const userDoc = (col, id) => doc(db, "users", UID, col, id);
const fbGet = async (col, id) => { try { const snap = await getDoc(userDoc(col, id)); return snap.exists() ? snap.data() : null; } catch { return null; } };
const fbSet = async (col, id, data) => { try { await setDoc(userDoc(col, id), data); } catch (e) { console.error("Save failed:", e); } };
const fbDel = async (col, id) => { try { await deleteDoc(userDoc(col, id)); } catch {} };
const fbGetAll = async (col) => { try { const snap = await getDocs(collection(db, "users", UID, col)); return snap.docs.map(d => ({ id: d.id, ...d.data() })); } catch { return []; } };

// ── Shared UI ────────────────────────────────────────────────────────────────

function Ring({ value, max, color, size, stroke, children }) {
  const s = size || 90; const st = stroke || 9;
  const r = (s - st) / 2; const circ = 2 * Math.PI * r; const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: s, height: s, flexShrink: 0 }}>
      <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={st} />
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={color} strokeWidth={st} strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f0eee8", ...(style || {}) }}>{children}</div>;
}

function MiniBar({ value, max, color }) {
  return <div style={{ height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 99 }}><div style={{ height: "100%", width: `${Math.min(value / max * 100, 100)}%`, background: color, borderRadius: 99 }} /></div>;
}

function MacroPills({ kcal, protein, carbs, fat }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 8 }}>
      {[["Kcal", Math.round(kcal), "#e85d26"], ["P", Math.round(protein) + "g", "#22c55e"], ["C", Math.round(carbs) + "g", "#60a5fa"], ["F", Math.round(fat) + "g", "#f59e0b"]].map(([l, v, c]) => (
        <div key={l} style={{ textAlign: "center", background: "#f8f6f2", borderRadius: 8, padding: "5px 2px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: c }}>{v}</div>
          <div style={{ fontSize: 9, color: "#aaa" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{ position: "fixed", top: 28, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#fff", padding: "12px 22px", borderRadius: 99, fontSize: 13, fontWeight: 700, zIndex: 99999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap", pointerEvents: "none" }}>{msg}</div>;
}

function DarkHeader({ tag, title, children }) {
  return (
    <div style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", padding: "48px 20px 20px", color: "#fff" }}>
      <div style={{ fontSize: 10, color: "#e85d26", fontFamily: "monospace", letterSpacing: 3, marginBottom: 8 }}>{tag}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #eee", overflowX: "auto" }}>
      {tabs.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} style={{ flexShrink: 0, padding: "12px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: active === key ? "#e85d26" : "#aaa", borderBottom: `2.5px solid ${active === key ? "#e85d26" : "transparent"}` }}>{label}</button>
      ))}
    </div>
  );
}

// ── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ totals, suppLog, weightLog, weeklyData, sessions, onExport }) {
  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const latest = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : null;
  const change = latest ? (latest - 67).toFixed(1) : null;
  const remaining = Math.max(Math.round(TARGETS.kcal - totals.kcal), 0);
  const weekAvgKcal = weeklyData.filter(d => d.kcal > 0).length > 0 ? Math.round(weeklyData.reduce((s, d) => s + d.kcal, 0) / weeklyData.filter(d => d.kcal > 0).length) : 0;
  const weekTrainCount = sessions.filter(s => { const d = new Date(s.date + "T00:00:00"); const now = new Date(); const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }).length;

  return (
    <div>
      <div style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", padding: "48px 20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 10, color: "#e85d26", fontFamily: "monospace", letterSpacing: 3, marginBottom: 8 }}>MY FITNESS HUB</div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{greeting} 👋</div>
        <div style={{ fontSize: 12, color: "#8899bb", marginBottom: 22 }}>{dateStr}</div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 18, display: "flex", gap: 18, alignItems: "center" }}>
          <Ring value={totals.kcal} max={TARGETS.kcal} color="#e85d26" size={90} stroke={9}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{Math.round(totals.kcal)}</div>
            <div style={{ fontSize: 9, color: "#8899bb", marginTop: 2 }}>kcal</div>
          </Ring>
          <div style={{ flex: 1 }}>
            {[["Protein", totals.protein, TARGETS.protein, "#22c55e"], ["Carbs", totals.carbs, TARGETS.carbs, "#60a5fa"], ["Fat", totals.fat, TARGETS.fat, "#f59e0b"]].map(([l, v, t, c]) => (
              <div key={l} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "#8899bb" }}>{l}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{Math.round(v)}g / {t}g</span>
                </div>
                <MiniBar value={v} max={t} color={c} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <Card style={{ margin: 0, textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#aaa", fontFamily: "monospace", marginBottom: 4 }}>KCAL LEFT</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: remaining > 0 ? "#e85d26" : "#22c55e" }}>{remaining}</div>
          </Card>
          <Card style={{ margin: 0, textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#aaa", fontFamily: "monospace", marginBottom: 4 }}>WEIGHT</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e" }}>{latest ? latest : "–"}<span style={{ fontSize: 11 }}>{latest ? "kg" : ""}</span></div>
            {change && <div style={{ fontSize: 9, color: parseFloat(change) <= 0 ? "#22c55e" : "#e85d26" }}>{parseFloat(change) <= 0 ? "↓" : "↑"}{Math.abs(change)}kg</div>}
          </Card>
          <Card style={{ margin: 0, textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 9, color: "#aaa", fontFamily: "monospace", marginBottom: 4 }}>TRAINED</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: weekTrainCount > 0 ? "#22c55e" : "#aaa" }}>{weekTrainCount}</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>this week</div>
          </Card>
        </div>

        {weeklyData.length > 0 && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>📊 7-Day Calories</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>Avg: {weekAvgKcal} kcal · Target: {TARGETS.kcal}</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="shortLabel" tick={{ fontSize: 10, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 9, fill: "#aaa" }} domain={[0, Math.max(TARGETS.kcal * 1.2, 500)]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [v + " kcal", "Calories"]} />
                <ReferenceLine y={TARGETS.kcal} stroke="#e85d2660" strokeDasharray="4 4" />
                <Bar dataKey="kcal" fill="#e85d26" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {weeklyData.length > 0 && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>💪 7-Day Protein</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>Target: {TARGETS.protein}g/day</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="shortLabel" tick={{ fontSize: 10, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 9, fill: "#aaa" }} domain={[0, 180]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [v + "g", "Protein"]} />
                <ReferenceLine y={TARGETS.protein} stroke="#22c55e60" strokeDasharray="4 4" />
                <Bar dataKey="protein" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>💊 Supplements</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: suppLog.length === SUPPLEMENTS.length ? "#22c55e" : "#e85d26" }}>{suppLog.length}/{SUPPLEMENTS.length}</div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {SUPPLEMENTS.map(s => (
              <div key={s.id} style={{ padding: "5px 12px", borderRadius: 99, background: suppLog.includes(s.id) ? s.color + "20" : "#f5f5f5", border: `1.5px solid ${suppLog.includes(s.id) ? s.color + "40" : "#eee"}`, fontSize: 11, color: suppLog.includes(s.id) ? s.color : "#bbb", fontWeight: 600 }}>
                {suppLog.includes(s.id) ? "✓ " : ""}{s.label.split(" ")[0]}
              </div>
            ))}
          </div>
        </Card>

        <button type="button" onClick={onExport} style={{ width: "100%", padding: "13px", background: "#f8f6f2", border: "1.5px solid #eee", borderRadius: 13, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#666", marginBottom: 12 }}>
          📥 Export All Data (JSON backup)
        </button>
      </div>
    </div>
  );
}

// ── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab({ foodLog, totals, onAdd, onRemove, myFoods, onSaveFood, onDeleteMyFood }) {
  const [subTab, setSubTab] = useState("quick");
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [planOpen, setPlanOpen] = useState(null);
  const [toast, setToast] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [manual, setManual] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  function logItem(name, kcal, protein, carbs, fat) {
    onAdd({ id: Date.now() + "_" + Math.random(), name: String(name), kcal: Number(kcal) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 });
    showToast("✅ " + name + " added!");
  }

  function handleSearch(q) {
    setSearchQ(q);
    if (!q.trim()) { setSearchRes([]); return; }
    setSearchRes(FOOD_DB.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8));
  }

  function submitManual() {
    if (!manual.name.trim() || !manual.kcal) return;
    logItem(manual.name, manual.kcal, manual.protein, manual.carbs, manual.fat);
  }

  const tabs = [["quick", "⚡ Meals"], ["myfoods", `⭐ My Foods (${myFoods.length})`], ["search", "🔍 Search"], ["manual", "✏️ Manual"], ["log", `📋 Log (${foodLog.length})`]];

  return (
    <div>
      <Toast msg={toast} />
      <DarkHeader tag="FOOD TRACKER" title="Log Food 📝">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 12 }}>
          {[["Kcal", Math.round(totals.kcal), "#e85d26"], ["Prot", Math.round(totals.protein) + "g", "#22c55e"], ["Carb", Math.round(totals.carbs) + "g", "#60a5fa"], ["Fat", Math.round(totals.fat) + "g", "#f59e0b"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </DarkHeader>

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      <div style={{ padding: "14px 14px 0" }}>

        {subTab === "quick" && (
          <div>
            <button type="button" onClick={() => setShowPlan(!showPlan)} style={{ width: "100%", padding: "11px", background: "#f0f4ff", border: "1.5px solid #c7d7ff", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#3b82f6", cursor: "pointer", marginBottom: 14 }}>
              {showPlan ? "▲ Hide Meal Plan" : "📋 View Meal Plan"}
            </button>
            {showPlan && (
              <div style={{ marginBottom: 14 }}>
                {PLAN_DETAIL.map(meal => (
                  <Card key={meal.id}>
                    <div onClick={() => setPlanOpen(planOpen === meal.id ? null : meal.id)} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{meal.emoji} {meal.label} <span style={{ fontSize: 11, color: "#aaa" }}>{meal.time}</span></div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#e85d26" }}>{meal.kcal} kcal</div>
                      </div>
                      {planOpen === meal.id && (
                        <div style={{ marginTop: 10 }}>
                          {meal.ingredients.map((ing, i) => <div key={i} style={{ fontSize: 12, color: "#555", paddingLeft: 8, marginBottom: 4 }}>• {ing}</div>)}
                          <div style={{ background: "#f8f6f2", borderRadius: 10, padding: "8px 12px", marginTop: 8, fontSize: 11, color: "#666" }}><strong>Prep:</strong> {meal.prep}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {MEALS.map(meal => (
              <Card key={meal.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", marginBottom: 2 }}>{meal.time}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{meal.emoji} {meal.label}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{meal.kcal} kcal · {meal.protein}g protein</div>
                  </div>
                  <button type="button" onClick={() => logItem(meal.label, meal.kcal, meal.protein, meal.carbs, meal.fat)} style={{ padding: "10px 16px", background: "#e85d26", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, minHeight: 44 }}>+ All</button>
                </div>
                <button type="button" onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)} style={{ width: "100%", padding: "10px", background: "#f8f6f2", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, color: "#666", fontWeight: 600 }}>
                  {expandedMeal === meal.id ? "▲ Hide items" : "▼ Add individual items"}
                </button>
                {expandedMeal === meal.id && (
                  <div style={{ marginTop: 10 }}>
                    {meal.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f6f2", borderRadius: 12, padding: "12px", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.name}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
                            {[["Kcal", item.kcal, "#e85d26"], ["P", item.protein + "g", "#22c55e"], ["C", item.carbs + "g", "#60a5fa"], ["F", item.fat + "g", "#f59e0b"]].map(([l, v, c]) => (
                              <div key={l} style={{ textAlign: "center", background: "#fff", borderRadius: 7, padding: "4px 2px" }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: c }}>{typeof v === "number" ? Math.round(v) : v}</div>
                                <div style={{ fontSize: 9, color: "#aaa" }}>{l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button type="button" onClick={() => logItem(item.name, item.kcal, item.protein, item.carbs, item.fat)} style={{ width: 48, height: 48, borderRadius: 12, background: "#1a1a2e", color: "#fff", border: "none", cursor: "pointer", fontSize: 24, flexShrink: 0 }}>+</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {subTab === "myfoods" && (
          <div>
            {myFoods.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#888", marginBottom: 6 }}>No saved foods yet</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Add foods in ✏️ Manual tab then tap "Save to My Foods"</div>
                </div>
              </Card>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Tap + to add to today's log</div>
                {myFoods.map((food, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0eee8" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⭐ {food.name}</div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                        <span style={{ color: "#e85d26", fontWeight: 700 }}>{food.kcal} kcal</span>
                        <span style={{ color: "#22c55e" }}>{food.protein}g P</span>
                        <span style={{ color: "#60a5fa" }}>{food.carbs}g C</span>
                        <span style={{ color: "#f59e0b" }}>{food.fat}g F</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => onDeleteMyFood(food.name)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff0f0", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
                    <button type="button" onClick={() => logItem(food.name, food.kcal, food.protein, food.carbs, food.fat)} style={{ width: 44, height: 44, borderRadius: 12, background: "#e85d26", color: "#fff", border: "none", cursor: "pointer", fontSize: 22 }}>+</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === "search" && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>🔍 Food Search</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Search from {FOOD_DB.length} common UK & Indian foods.</div>
            <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="e.g. banana, dal, paneer…"
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #eee", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box", marginBottom: 10 }} />
            {searchRes.map((food, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f6f2", borderRadius: 12, padding: "12px", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{food.name}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                    <span style={{ color: "#e85d26", fontWeight: 700 }}>{food.kcal} kcal</span>
                    <span style={{ color: "#22c55e" }}>{food.protein}g P</span>
                    <span style={{ color: "#60a5fa" }}>{food.carbs}g C</span>
                    <span style={{ color: "#f59e0b" }}>{food.fat}g F</span>
                  </div>
                </div>
                <button type="button" onClick={() => logItem(food.name, food.kcal, food.protein, food.carbs, food.fat)} style={{ width: 44, height: 44, borderRadius: 12, background: "#e85d26", color: "#fff", border: "none", cursor: "pointer", fontSize: 22 }}>+</button>
              </div>
            ))}
            {searchQ && searchRes.length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "#aaa", fontSize: 13 }}>No results. Try Manual Entry.</div>}
          </Card>
        )}

        {subTab === "manual" && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>✏️ Manual Entry</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Enter macros from a food label or menu.</div>
            <input value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} placeholder="Food name *" type="text"
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fafafa", marginBottom: 10, boxSizing: "border-box" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["Calories (kcal) *", "kcal", "#e85d26"], ["Protein (g)", "protein", "#22c55e"], ["Carbs (g)", "carbs", "#60a5fa"], ["Fat (g)", "fat", "#f59e0b"]].map(([label, key, color]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color, marginBottom: 4, fontFamily: "monospace", fontWeight: 700 }}>{label}</div>
                  <input type="number" value={manual[key]} onChange={e => setManual(p => ({ ...p, [key]: e.target.value }))} placeholder="0"
                    style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            {manual.name && manual.kcal && (
              <div style={{ marginBottom: 12, background: "#f8f6f2", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{manual.name}</div>
                <MacroPills kcal={manual.kcal} protein={manual.protein || 0} carbs={manual.carbs || 0} fat={manual.fat || 0} />
              </div>
            )}
            <button type="button" onClick={submitManual} style={{ width: "100%", padding: "14px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 13, fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 50, marginBottom: 8 }}>+ Add to Log</button>
            {manual.name && manual.kcal && (
              <button type="button" onClick={() => { onSaveFood({ name: manual.name, kcal: Number(manual.kcal) || 0, protein: Number(manual.protein) || 0, carbs: Number(manual.carbs) || 0, fat: Number(manual.fat) || 0 }); showToast("⭐ " + manual.name + " saved to My Foods!"); }} style={{ width: "100%", padding: "12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 13, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⭐ Save to My Foods</button>
            )}
          </Card>
        )}

        {subTab === "log" && (
          <div>
            {foodLog.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#bbb" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#888" }}>Nothing logged yet today</div>
              </div>
            ) : (
              <>
                <Card style={{ background: "#1a1a2e", border: "none" }}>
                  <div style={{ fontSize: 10, color: "#8899bb", fontFamily: "monospace", marginBottom: 10 }}>TODAY'S TOTAL</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {[["Kcal", Math.round(totals.kcal), TARGETS.kcal, "#e85d26"], ["P", Math.round(totals.protein) + "g", TARGETS.protein + "g", "#22c55e"], ["C", Math.round(totals.carbs) + "g", TARGETS.carbs + "g", "#60a5fa"], ["F", Math.round(totals.fat) + "g", TARGETS.fat + "g", "#f59e0b"]].map(([l, v, t, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 9, color: "#667" }}>/ {t}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                {foodLog.map(item => (
                  <Card key={item.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>🍽️ {item.name}</div>
                        <MacroPills kcal={item.kcal} protein={item.protein} carbs={item.carbs} fat={item.fat} />
                      </div>
                      <button type="button" onClick={() => onRemove(item.id)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff0f0", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 15, flexShrink: 0, marginLeft: 10 }}>✕</button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Train Tab ────────────────────────────────────────────────────────────────

function TrainTab({ sessions, onSaveSession, onDeleteSession, weeklyData }) {
  const [subTab, setSubTab] = useState("log");
  const [mode, setMode] = useState(null); // weights | bodyweight | cardio
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [cardioData, setCardioData] = useState({ type: "Treadmill", duration: "", distance: "", notes: "" });
  const [customEx, setCustomEx] = useState("");
  const [selectedEx, setSelectedEx] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const [progressEx, setProgressEx] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  const today = getToday();
  const exDb = mode === "weights" ? GYM_EXERCISES : mode === "bodyweight" ? BW_EXERCISES : {};

  function addExercise(name) {
    if (!name.trim()) return;
    if (exercises.find(e => e.name === name)) return;
    setExercises(prev => [...prev, { name, sets: [{ reps: "", weight: "" }] }]);
    setSelectedEx(""); setCustomEx("");
  }

  function addSet(exIdx) {
    setExercises(prev => prev.map((e, i) => i === exIdx ? { ...e, sets: [...e.sets, { reps: "", weight: "" }] } : e));
  }

  function removeSet(exIdx, setIdx) {
    setExercises(prev => prev.map((e, i) => i === exIdx ? { ...e, sets: e.sets.filter((_, si) => si !== setIdx) } : e));
  }

  function updateSet(exIdx, setIdx, field, val) {
    setExercises(prev => prev.map((e, i) => i === exIdx ? { ...e, sets: e.sets.map((s, si) => si === setIdx ? { ...s, [field]: val } : s) } : e));
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  async function saveSession() {
    if (mode === "cardio" && !cardioData.duration) return;
    if ((mode === "weights" || mode === "bodyweight") && exercises.length === 0) return;
    setSaving(true);
    const id = "session_" + Date.now();
    const totalVolume = mode === "weights" ? exercises.reduce((sum, ex) => sum + ex.sets.reduce((s2, st) => s2 + ((Number(st.reps) || 0) * (Number(st.weight) || 0)), 0), 0) : 0;
    const session = {
      id, date: today, mode,
      sessionName: sessionName || (mode === "cardio" ? cardioData.type : "Session"),
      exercises: mode !== "cardio" ? exercises : [],
      cardioData: mode === "cardio" ? cardioData : null,
      totalVolume, notes: "",
      savedAt: new Date().toISOString()
    };
    await onSaveSession(session);
    showToast("✅ Session saved!");
    setMode(null); setSessionName(""); setExercises([]); setCardioData({ type: "Treadmill", duration: "", distance: "", notes: "" });
    setSaving(false);
    setSubTab("history");
  }

  // Build progression data for a given exercise
  function getProgressData(exName) {
    return sessions
      .filter(s => s.exercises && s.exercises.find(e => e.name === exName))
      .map(s => {
        const ex = s.exercises.find(e => e.name === exName);
        const topWeight = Math.max(...ex.sets.map(st => Number(st.weight) || 0));
        const topReps = ex.sets.find(st => Number(st.weight) === topWeight)?.reps || 0;
        return { date: fmtDate(s.date), weight: topWeight, reps: Number(topReps) };
      })
      .slice(-12);
  }

  // All unique exercise names from history
  const allExNames = [...new Set(sessions.flatMap(s => (s.exercises || []).map(e => e.name)))];

  // Personal bests
  function getPB(exName) {
    const data = getProgressData(exName);
    if (!data.length) return null;
    return data.reduce((best, d) => d.weight > best.weight ? d : best, data[0]);
  }

  const tabs = [["log", "📝 Log Session"], ["history", `📋 History (${sessions.length})`], ["progress", "📈 Progress"], ["analysis", "🧠 Analysis"]];

  return (
    <div>
      <Toast msg={toast} />
      <DarkHeader tag="TRAINING" title="Train 🏋️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e85d26" }}>{sessions.filter(s => s.date === today).length > 0 ? "✅" : "–"}</div>
            <div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>Today</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>{sessions.filter(s => { const d = new Date(s.date + "T00:00:00"); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }).length}</div>
            <div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>This week</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>{sessions.length}</div>
            <div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>Total</div>
          </div>
        </div>
      </DarkHeader>

      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />

      <div style={{ padding: "14px 14px 0" }}>

        {/* ── LOG SESSION ── */}
        {subTab === "log" && (
          <div>
            {!mode ? (
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>Choose training mode</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[["🏋️", "Weights", "weights", "Gym — sets, reps, kg"], ["💪", "Bodyweight", "bodyweight", "No equipment"], ["🏃", "Cardio", "cardio", "Run, cycle, row"]].map(([emoji, label, val, sub]) => (
                    <button key={val} type="button" onClick={() => setMode(val)} style={{ padding: "16px 8px", borderRadius: 14, border: "2px solid #eee", background: "#f8f6f2", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 28 }}>{emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{label}</span>
                      <span style={{ fontSize: 10, color: "#aaa", textAlign: "center" }}>{sub}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : (
              <div>
                {/* Session header */}
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{mode === "weights" ? "🏋️ Weights" : mode === "bodyweight" ? "💪 Bodyweight" : "🏃 Cardio"}</div>
                    <button type="button" onClick={() => { setMode(null); setExercises([]); }} style={{ padding: "6px 12px", background: "#f0f0f0", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>✕ Cancel</button>
                  </div>
                  <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder={mode === "cardio" ? "Session name (optional)" : "e.g. Chest & Triceps"}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
                </Card>

                {/* CARDIO MODE */}
                {mode === "cardio" && (
                  <Card>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Cardio Details</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontFamily: "monospace" }}>TYPE</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {CARDIO_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => setCardioData(p => ({ ...p, type: t }))} style={{ padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${cardioData.type === t ? "#1a1a2e" : "#eee"}`, background: cardioData.type === t ? "#1a1a2e" : "#f8f6f2", color: cardioData.type === t ? "#fff" : "#666", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontFamily: "monospace" }}>DURATION (mins) *</div>
                        <input type="number" value={cardioData.duration} onChange={e => setCardioData(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 30"
                          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontFamily: "monospace" }}>DISTANCE (km)</div>
                        <input type="number" step="0.1" value={cardioData.distance} onChange={e => setCardioData(p => ({ ...p, distance: e.target.value }))} placeholder="e.g. 5"
                          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    {cardioData.duration && cardioData.distance && (
                      <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                        Avg pace: {(Number(cardioData.duration) / Number(cardioData.distance)).toFixed(1)} min/km
                      </div>
                    )}
                    <input type="text" value={cardioData.notes} onChange={e => setCardioData(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)"
                      style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", boxSizing: "border-box" }} />
                  </Card>
                )}

                {/* WEIGHTS / BODYWEIGHT MODE */}
                {(mode === "weights" || mode === "bodyweight") && (
                  <div>
                    {/* Add exercise */}
                    <Card>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add Exercise</div>
                      {Object.entries(exDb).map(([group, exList]) => (
                        <div key={group} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", marginBottom: 6 }}>{group.toUpperCase()}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {exList.map(ex => (
                              <button key={ex} type="button" onClick={() => addExercise(ex)} disabled={!!exercises.find(e => e.name === ex)} style={{ padding: "6px 12px", borderRadius: 99, border: "1.5px solid #eee", background: exercises.find(e => e.name === ex) ? "#e5e5e5" : "#f8f6f2", color: exercises.find(e => e.name === ex) ? "#aaa" : "#333", fontSize: 12, fontWeight: 600, cursor: exercises.find(e => e.name === ex) ? "default" : "pointer" }}>{ex} {exercises.find(e => e.name === ex) ? "✓" : "+"}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <input value={customEx} onChange={e => setCustomEx(e.target.value)} placeholder="Custom exercise name…"
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa" }} />
                        <button type="button" onClick={() => addExercise(customEx)} style={{ padding: "10px 16px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Add</button>
                      </div>
                    </Card>

                    {/* Exercise cards */}
                    {exercises.map((ex, exIdx) => (
                      <Card key={exIdx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                          <button type="button" onClick={() => removeExercise(exIdx)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff0f0", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 13 }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: mode === "weights" ? "40px 1fr 1fr 40px" : "40px 1fr 40px", gap: 6, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", alignSelf: "end", paddingBottom: 6 }}>Set</div>
                          <div style={{ fontSize: 10, color: "#22c55e", fontFamily: "monospace", alignSelf: "end", paddingBottom: 6 }}>REPS</div>
                          {mode === "weights" && <div style={{ fontSize: 10, color: "#60a5fa", fontFamily: "monospace", alignSelf: "end", paddingBottom: 6 }}>KG</div>}
                          <div></div>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} style={{ display: "grid", gridTemplateColumns: mode === "weights" ? "40px 1fr 1fr 40px" : "40px 1fr 40px", gap: 6, marginBottom: 6 }}>
                            <div style={{ textAlign: "center", fontSize: 13, color: "#aaa", lineHeight: "40px", fontWeight: 700 }}>{setIdx + 1}</div>
                            <input type="number" value={set.reps} onChange={e => updateSet(exIdx, setIdx, "reps", e.target.value)} placeholder="0"
                              style={{ padding: "10px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, textAlign: "center", fontFamily: "inherit", outline: "none", background: "#fafafa" }} />
                            {mode === "weights" && (
                              <input type="number" step="0.5" value={set.weight} onChange={e => updateSet(exIdx, setIdx, "weight", e.target.value)} placeholder="0"
                                style={{ padding: "10px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 14, textAlign: "center", fontFamily: "inherit", outline: "none", background: "#fafafa" }} />
                            )}
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} style={{ width: 36, height: 40, borderRadius: 10, background: "#fff0f0", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 14 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addSet(exIdx)} style={{ width: "100%", padding: "8px", background: "#f8f6f2", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, color: "#666", fontWeight: 600, marginTop: 4 }}>+ Add Set</button>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Save button */}
                <button type="button" onClick={saveSession} disabled={saving} style={{ width: "100%", padding: "16px", background: saving ? "#aaa" : "#22c55e", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginBottom: 20 }}>
                  {saving ? "Saving…" : "✅ Save Session"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {subTab === "history" && (
          <div>
            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🏋️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#888" }}>No sessions logged yet</div>
              </div>
            ) : (
              [...sessions].reverse().map(session => (
                <Card key={session.id}>
                  <div onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", marginBottom: 2 }}>{fmtDate(session.date)}</div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{session.mode === "weights" ? "🏋️" : session.mode === "bodyweight" ? "💪" : "🏃"} {session.sessionName}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                          {session.mode === "cardio" ? `${session.cardioData?.duration} mins${session.cardioData?.distance ? ` · ${session.cardioData.distance}km` : ""}` : `${session.exercises?.length} exercises${session.totalVolume > 0 ? ` · ${Math.round(session.totalVolume)}kg volume` : ""}`}
                        </div>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }} style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff0f0", color: "#ef4444", border: "none", cursor: "pointer", fontSize: 13 }}>✕</button>
                    </div>
                  </div>
                  {expandedSession === session.id && (
                    <div style={{ marginTop: 12, borderTop: "1px solid #f5f5f5", paddingTop: 12 }}>
                      {session.mode === "cardio" ? (
                        <div style={{ background: "#f8f6f2", borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 12, color: "#555" }}>Type: {session.cardioData?.type}</div>
                          <div style={{ fontSize: 12, color: "#555" }}>Duration: {session.cardioData?.duration} mins</div>
                          {session.cardioData?.distance && <div style={{ fontSize: 12, color: "#555" }}>Distance: {session.cardioData.distance}km</div>}
                          {session.cardioData?.distance && session.cardioData?.duration && <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>Pace: {(Number(session.cardioData.duration) / Number(session.cardioData.distance)).toFixed(1)} min/km</div>}
                        </div>
                      ) : (
                        session.exercises?.map((ex, i) => (
                          <div key={i} style={{ marginBottom: 10, background: "#f8f6f2", borderRadius: 10, padding: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{ex.name}</div>
                            {ex.sets.map((set, si) => (
                              <div key={si} style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                                Set {si + 1}: {set.reps} reps{set.weight ? ` @ ${set.weight}kg` : ""}
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── PROGRESS ── */}
        {subTab === "progress" && (
          <div>
            {allExNames.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#888" }}>Log some weight sessions to track progress</div>
              </div>
            ) : (
              <div>
                {/* Personal bests */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>🏆 Personal Bests</div>
                  {allExNames.map(exName => {
                    const pb = getPB(exName);
                    if (!pb || !pb.weight) return null;
                    return (
                      <div key={exName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8f8f8" }}>
                        <span style={{ fontSize: 12, color: "#555" }}>{exName}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#e85d26" }}>{pb.weight}kg × {pb.reps} reps</span>
                      </div>
                    );
                  })}
                </Card>

                {/* Exercise progress graph */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>📈 Strength Progression</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {allExNames.map(ex => (
                      <button key={ex} type="button" onClick={() => setProgressEx(ex)} style={{ padding: "6px 12px", borderRadius: 99, border: `1.5px solid ${progressEx === ex ? "#1a1a2e" : "#eee"}`, background: progressEx === ex ? "#1a1a2e" : "#f8f6f2", color: progressEx === ex ? "#fff" : "#666", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{ex}</button>
                    ))}
                  </div>
                  {progressEx && (
                    <div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Top set weight for {progressEx}</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={getProgressData(progressEx)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#aaa" }} />
                          <YAxis tick={{ fontSize: 9, fill: "#aaa" }} domain={["auto", "auto"]} unit="kg" />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, n) => [v + "kg", "Top weight"]} />
                          <Line type="monotone" dataKey="weight" stroke="#e85d26" strokeWidth={2.5} dot={{ fill: "#e85d26", r: 5, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ── WEEKLY ANALYSIS ── */}
        {subTab === "analysis" && (
          <WeeklyAnalysis sessions={sessions} weeklyData={weeklyData} />
        )}
      </div>
    </div>
  );
}

function WeeklyAnalysis({ sessions, weeklyData }) {
  const [copied, setCopied] = useState(false);

  function buildReport() {
    const weekSessions = sessions.filter(s => {
      const d = new Date(s.date + "T00:00:00");
      const w = new Date(); w.setDate(w.getDate() - 7);
      return d >= w;
    });

    const avgKcal = weeklyData.filter(d => d.kcal > 0).length > 0
      ? Math.round(weeklyData.reduce((s, d) => s + d.kcal, 0) / weeklyData.filter(d => d.kcal > 0).length) : 0;
    const avgProtein = weeklyData.filter(d => d.protein > 0).length > 0
      ? Math.round(weeklyData.reduce((s, d) => s + d.protein, 0) / weeklyData.filter(d => d.protein > 0).length) : 0;

    const weights = weeklyData.filter(d => d.weight).map(d => d.weight);
    const weightChange = weights.length >= 2 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null;

    let report = `=== WEEKLY FITNESS ANALYSIS ===\nWeek ending: ${new Date().toLocaleDateString("en-GB")}\n\n`;
    report += `--- NUTRITION ---\n`;
    report += `Avg daily calories: ${avgKcal} kcal (target: ${TARGETS.kcal})\n`;
    report += `Avg daily protein: ${avgProtein}g (target: ${TARGETS.protein}g)\n`;
    report += `Daily breakdown:\n`;
    weeklyData.forEach(d => { report += `  ${d.shortLabel}: ${d.kcal} kcal, ${d.protein}g protein\n`; });

    report += `\n--- BODY ---\n`;
    if (weights.length > 0) {
      report += `Latest weight: ${weights[weights.length - 1]}kg\n`;
      if (weightChange) report += `Weight change this week: ${weightChange}kg\n`;
    } else { report += `No weight logged this week\n`; }

    report += `\n--- TRAINING (${weekSessions.length} sessions) ---\n`;
    if (weekSessions.length === 0) {
      report += `No training sessions logged this week\n`;
    } else {
      weekSessions.forEach(s => {
        report += `\n${fmtDate(s.date)} — ${s.sessionName} (${s.mode})\n`;
        if (s.mode === "cardio") {
          report += `  ${s.cardioData?.type}: ${s.cardioData?.duration} mins`;
          if (s.cardioData?.distance) report += `, ${s.cardioData.distance}km`;
          report += `\n`;
        } else {
          s.exercises?.forEach(ex => {
            report += `  ${ex.name}:\n`;
            ex.sets.forEach((set, i) => {
              report += `    Set ${i + 1}: ${set.reps} reps${set.weight ? ` @ ${set.weight}kg` : ""}\n`;
            });
          });
          if (s.totalVolume > 0) report += `  Total volume: ${Math.round(s.totalVolume)}kg\n`;
        }
      });
    }

    report += `\n=== END OF REPORT ===\nPlease analyse my week and give me specific feedback on:\n1. Body recomposition progress\n2. Strength/fitness progress\n3. Nutrition consistency\n4. Recommendations for next week`;
    return report;
  }

  function copyReport() {
    const report = buildReport();
    navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000); }).catch(() => {});
  }

  return (
    <div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>🧠 Weekly Analysis</div>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>
          This compiles your full week of data — nutrition, weight, training — into a report you can paste to Claude for detailed analysis.
        </div>
        <div style={{ background: "#f8f6f2", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#555", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: 200, overflow: "auto" }}>
            {buildReport()}
          </div>
        </div>
        <button type="button" onClick={copyReport} style={{ width: "100%", padding: "14px", background: copied ? "#22c55e" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {copied ? "✅ Copied! Paste to Claude" : "📋 Copy Report to Clipboard"}
        </button>
      </Card>
      <Card style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>How to use this</div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>
          1. Tap "Copy Report to Clipboard"{"\n"}
          2. Open a new Claude conversation{"\n"}
          3. Paste the report{"\n"}
          4. Claude will analyse your week and give specific recommendations
        </div>
      </Card>
    </div>
  );
}

// ── Body Tab ─────────────────────────────────────────────────────────────────

function BodyTab({ weightLog, onAdd, photos, onAddPhoto, onDeletePhoto }) {
  const [bodyTab, setBodyTab] = useState("weight");
  const [weightInput, setWeightInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const today = getToday();
  const todayEntry = weightLog.find(w => w.date === today);
  const latest = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : null;
  const change = latest ? (latest - 67).toFixed(1) : null;
  const bmi = latest ? (latest / (1.68 * 1.68)).toFixed(1) : null;
  const chartData = weightLog.slice(-30).map(w => ({ date: fmtDate(w.date), weight: parseFloat(w.weight) }));

  async function handleSave() {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 30 || w > 300) return;
    await onAdd({ date: today, weight: w });
    setSaved(true); setWeightInput("");
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compress(file);
      await onAddPhoto({ id: String(Date.now()), date: today, dataUrl, note: photoNote.trim() });
      setPhotoNote("");
    } catch (err) { alert("Photo failed: " + (err.message || "Unknown error")); }
    e.target.value = "";
    setUploading(false);
  }

  return (
    <div>
      <DarkHeader tag="BODY STATS" title="Body Tracker ⚖️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 12 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#e85d26" }}>{latest ? `${latest}kg` : "–"}</div><div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>Current</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: change && parseFloat(change) <= 0 ? "#22c55e" : "#f59e0b" }}>{change ? `${parseFloat(change) <= 0 ? "" : "+"}${change}kg` : "–"}</div><div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>Change</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>{bmi || "–"}</div><div style={{ fontSize: 9, color: "#667", marginTop: 2 }}>BMI</div></div>
        </div>
      </DarkHeader>

      <SubTabs tabs={[["weight", "⚖️ Weight"], ["photos", `📸 Photos (${photos.length})`]]} active={bodyTab} onChange={setBodyTab} />

      <div style={{ padding: "14px 14px 0" }}>
        {bodyTab === "weight" && (
          <div>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>{todayEntry ? `✅ Today: ${todayEntry.weight}kg` : "Log Today's Weight"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder={todayEntry ? `Update (was ${todayEntry.weight})` : "e.g. 66.2"}
                  style={{ flex: 1, padding: "14px", borderRadius: 13, border: "1.5px solid #eee", fontSize: 18, fontFamily: "inherit", outline: "none", background: "#fafafa" }} />
                <button type="button" onClick={handleSave} style={{ padding: "14px 20px", background: "#1a1a2e", color: "#fff", borderRadius: 13, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, minWidth: 64, minHeight: 50 }}>{saved ? "✅" : "Save"}</button>
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>⏰ Weigh yourself first thing in the morning</div>
            </Card>
            {chartData.length > 1 ? (
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>Weight Trend</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#aaa" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#aaa" }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <ReferenceLine y={67} stroke="#e85d2640" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="weight" stroke="#1a1a2e" strokeWidth={2.5} dot={{ fill: "#e85d26", r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 4 }}>Dashed = starting weight 67kg</div>
              </Card>
            ) : (
              <Card style={{ textAlign: "center", padding: "28px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📈</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>Log weight daily to see your trend</div>
              </Card>
            )}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>📋 Your Stats</div>
              {[["Starting Weight", "67kg"], ["Height", "168cm"], ["Age", "28"], ["Calorie Target", "1,950 kcal"], ["Protein Target", "134g/day"], ["Body Fat (baseline)", "22.7%"], ["Visceral Fat (baseline)", "8"], ["BMI", bmi ? `${bmi}` : "–"], ["Goal", "Body recomposition 💪"]].map(([l, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f8f8f8" : "none" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {bodyTab === "photos" && (
          <div>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>📸 Add Progress Photo</div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Take a photo at the same time daily for best comparison.</div>
              <input type="text" value={photoNote} onChange={e => setPhotoNote(e.target.value)} placeholder="Optional note (e.g. Week 3 front)"
                style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #eee", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fafafa", marginBottom: 12, boxSizing: "border-box" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["📷", "Take Photo", "environment"], ["🖼️", "Upload", ""]].map(([icon, label, capture]) => (
                  <div key={label} style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "16px 10px", background: label === "Take Photo" ? "#1a1a2e" : "#f8f6f2", color: label === "Take Photo" ? "#fff" : "#1a1a2e", textAlign: "center", fontSize: 13, fontWeight: 700, lineHeight: 1.4, border: label !== "Take Photo" ? "1.5px solid #eee" : "none", pointerEvents: "none" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                      {uploading ? "Saving…" : label}
                    </div>
                    <input type="file" accept="image/*" {...(capture ? { capture } : {})} onChange={handlePhoto} disabled={uploading}
                      style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: uploading ? "not-allowed" : "pointer" }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#bbb", textAlign: "center" }}>Photos saved to Firebase — never lost</div>
            </Card>
            {photos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#888" }}>No photos yet</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 10, fontFamily: "monospace" }}>{photos.length} PROGRESS PHOTOS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[...photos].reverse().map(photo => (
                    <div key={photo.id} onClick={() => setViewPhoto(photo)} style={{ cursor: "pointer", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", position: "relative" }}>
                      <img src={photo.dataUrl} alt="Progress" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                      <div style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%)", padding: "20px 10px 10px", position: "absolute", bottom: 0, left: 0, right: 0 }}>
                        <div style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{fmtDate(photo.date)}</div>
                        {photo.note && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{photo.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewPhoto && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", color: "#fff" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDate(viewPhoto.date)}</div>
                    {viewPhoto.note && <div style={{ fontSize: 11, color: "#aaa" }}>{viewPhoto.note}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => { onDeletePhoto(viewPhoto.id); setViewPhoto(null); }} style={{ padding: "8px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Delete</button>
                    <button type="button" onClick={() => setViewPhoto(null)} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Close</button>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px 20px" }}>
                  <img src={viewPhoto.dataUrl} alt="Progress" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Supplements Tab ──────────────────────────────────────────────────────────

function SuppsTab({ suppLog, onToggle }) {
  const pct = Math.round((suppLog.length / SUPPLEMENTS.length) * 100);
  const groups = [
    { title: "🌅 Morning", items: SUPPLEMENTS.filter(s => s.time === "Morning") },
    { title: "🌙 With Dinner", items: SUPPLEMENTS.filter(s => s.time === "With Dinner") },
    { title: "😴 Before Bed", items: SUPPLEMENTS.filter(s => s.time === "Before Bed") },
  ];
  return (
    <div>
      <DarkHeader tag="DAILY STACK" title="Supplements 💊">
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#8899bb" }}>Today's progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "#22c55e" : "#e85d26" }}>{suppLog.length}/{SUPPLEMENTS.length} taken</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22c55e" : "#e85d26", borderRadius: 99 }} />
          </div>
        </div>
      </DarkHeader>
      <div style={{ padding: "14px 14px 0" }}>
        {groups.map(group => (
          <Card key={group.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>{group.title}</div>
            {group.items.map(supp => {
              const done = suppLog.includes(supp.id);
              return (
                <button key={supp.id} type="button" onClick={() => onToggle(supp.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px", marginBottom: 8, borderRadius: 13, cursor: "pointer", textAlign: "left", background: done ? supp.color + "15" : "#f8f6f2", border: `1.5px solid ${done ? supp.color + "50" : "#f0ece8"}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: done ? supp.color : "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: done ? 16 : 18, color: done ? "#fff" : "#aaa", fontWeight: 700 }}>{done ? "✓" : supp.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: done ? supp.color : "#1a1a1a" }}>{supp.label}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{supp.time}</div>
                  </div>
                  {done && <div style={{ fontSize: 18 }}>✅</div>}
                </button>
              );
            })}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("home");
  const [foodLog, setFoodLog] = useState([]);
  const [suppLog, setSuppLog] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [myFoods, setMyFoods] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const today = getToday();
      const fd = await fbGet("food", today);
      const sl = await fbGet("supplements", today);
      const wd = await fbGet("stats", "weight");
      const mf = await fbGet("data", "myfoods");
      const wl = wd?.entries || [];

      setFoodLog(fd?.items || []);
      setSuppLog(sl?.taken || []);
      setWeightLog(wl);
      setMyFoods(mf?.items || []);

      // Load photos
      const allPhotos = await fbGetAll("photos");
      allPhotos.sort((a, b) => a.date.localeCompare(b.date));
      setPhotos(allPhotos);

      // Load training sessions
      const allSessions = await fbGetAll("sessions");
      allSessions.sort((a, b) => a.date.localeCompare(b.date));
      setSessions(allSessions);

      // Weekly chart data
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const df = dateStr === today ? (fd?.items || []) : ((await fbGet("food", dateStr))?.items || []);
        const wEntry = wl.find(w => w.date === dateStr);
        days.push({
          date: dateStr, shortLabel: dayLabel(dateStr),
          kcal: Math.round(df.reduce((s, f) => s + (Number(f.kcal) || 0), 0)),
          protein: Math.round(df.reduce((s, f) => s + (Number(f.protein) || 0), 0)),
          weight: wEntry ? wEntry.weight : null,
        });
      }
      setWeeklyData(days);
      setReady(true);
    })();
  }, []);

  async function addFood(item) {
    const updated = [...foodLog, item];
    setFoodLog(updated);
    await fbSet("food", getToday(), { items: updated, date: getToday() });
  }

  async function removeFood(id) {
    const updated = foodLog.filter(f => f.id !== id);
    setFoodLog(updated);
    await fbSet("food", getToday(), { items: updated, date: getToday() });
  }

  async function toggleSupp(id) {
    const updated = suppLog.includes(id) ? suppLog.filter(s => s !== id) : [...suppLog, id];
    setSuppLog(updated);
    await fbSet("supplements", getToday(), { taken: updated, date: getToday() });
  }

  async function addWeight(entry) {
    const updated = [...weightLog.filter(w => w.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(updated);
    await fbSet("stats", "weight", { entries: updated });
    setWeeklyData(prev => prev.map(d => d.date === entry.date ? { ...d, weight: entry.weight } : d));
  }

  async function addPhoto(photo) {
    await fbSet("photos", photo.id, photo);
    setPhotos(prev => [...prev, photo]);
  }

  async function deletePhoto(id) {
    await fbDel("photos", id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  async function saveMyFood(food) {
    const updated = [...myFoods.filter(f => f.name !== food.name), food];
    setMyFoods(updated);
    await fbSet("data", "myfoods", { items: updated });
  }

  async function deleteMyFood(name) {
    const updated = myFoods.filter(f => f.name !== name);
    setMyFoods(updated);
    await fbSet("data", "myfoods", { items: updated });
  }

  async function saveSession(session) {
    await fbSet("sessions", session.id, session);
    setSessions(prev => [...prev, session].sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function deleteSession(id) {
    await fbDel("sessions", id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function exportData() {
    const data = { foodLog, suppLog, weightLog, myFoods, sessions, photos: photos.map(p => ({ ...p, dataUrl: "[image]" })), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fitness-hub-${getToday()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const totals = foodLog.reduce((acc, f) => ({ kcal: acc.kcal + (Number(f.kcal) || 0), protein: acc.protein + (Number(f.protein) || 0), carbs: acc.carbs + (Number(f.carbs) || 0), fat: acc.fat + (Number(f.fat) || 0) }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  if (!ready) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🏋️</div>
      <div style={{ fontSize: 14, color: "#fff", fontFamily: "Georgia,serif" }}>Loading your hub…</div>
    </div>
  );

  const TABS = [{ id: "home", label: "Home", emoji: "🏠" }, { id: "log", label: "Log", emoji: "📝" }, { id: "train", label: "Train", emoji: "🏋️" }, { id: "body", label: "Body", emoji: "⚖️" }, { id: "supps", label: "Supps", emoji: "💊" }];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8f6f2", fontFamily: "Georgia,serif" }}>
      <div style={{ paddingBottom: 74 }}>
        {tab === "home" && <HomeTab totals={totals} suppLog={suppLog} weightLog={weightLog} weeklyData={weeklyData} sessions={sessions} onExport={exportData} />}
        {tab === "log" && <LogTab foodLog={foodLog} totals={totals} onAdd={addFood} onRemove={removeFood} myFoods={myFoods} onSaveFood={saveMyFood} onDeleteMyFood={deleteMyFood} />}
        {tab === "train" && <TrainTab sessions={sessions} onSaveSession={saveSession} onDeleteSession={deleteSession} weeklyData={weeklyData} />}
        {tab === "body" && <BodyTab weightLog={weightLog} onAdd={addWeight} photos={photos} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} />}
        {tab === "supps" && <SuppsTab suppLog={suppLog} onToggle={toggleSupp} />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", zIndex: 999, borderTop: "1px solid #eee", display: "flex", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 0 12px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderTop: `2.5px solid ${tab === t.id ? "#e85d26" : "transparent"}` }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{t.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: tab === t.id ? "#e85d26" : "#bbb" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
