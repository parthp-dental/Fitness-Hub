import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { db, UID } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

const TARGETS = { kcal: 1950, protein: 134, carbs: 230, fat: 55 };

const DEFAULT_MEALS = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅", time: "7:00am",
    items: [
      { name: "Actimel Original 100ml", kcal: 73, protein: 3, carbs: 11, fat: 1.5 },
      { name: "ASDA Greek Yogurt 100g", kcal: 66, protein: 7, carbs: 8, fat: 0.5 },
      { name: "Soya Protein Crispies 30g", kcal: 109, protein: 22.5, carbs: 2.3, fat: 0.7 },
      { name: "Blueberries x5", kcal: 5, protein: 0, carbs: 1, fat: 0 },
      { name: "Myprotein Whey Shake 25g", kcal: 109, protein: 17, carbs: 1.2, fat: 4 },
    ],
  },
  { id: "lunch", label: "Lunch", emoji: "☀️", time: "1:00pm",
    items: [
      { name: "Chickpeas 150g (cooked)", kcal: 206, protein: 13, carbs: 26, fat: 4 },
      { name: "Edamame Beans 100g", kcal: 155, protein: 12, carbs: 6.5, fat: 7.6 },
      { name: "LM Vegan Sausages x2", kcal: 130, protein: 13, carbs: 5, fat: 5 },
      { name: "Mixed Veg 150g", kcal: 50, protein: 3, carbs: 8, fat: 0.5 },
    ],
  },
  { id: "dinner", label: "Dinner", emoji: "🌙", time: "6:00pm",
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
  { name: "Paneer 100g (Apetina)", kcal: 174, protein: 22, carbs: 3.2, fat: 8 },
  { name: "Paneer 100g (Everest)", kcal: 347, protein: 20.9, carbs: 4.1, fat: 27.7 },
  { name: "Tofu 100g", kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: "Chickpeas 100g (cooked)", kcal: 148, protein: 8, carbs: 18, fat: 3 },
  { name: "Lentils 100g (cooked)", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Edamame 100g", kcal: 155, protein: 12, carbs: 6.5, fat: 7.6 },
  { name: "Oats 100g (dry)", kcal: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Brown Rice 100g (cooked)", kcal: 112, protein: 2.3, carbs: 24, fat: 0.8 },
  { name: "White Rice 100g (cooked)", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Wholemeal Bread (slice)", kcal: 78, protein: 3.5, carbs: 14, fat: 1 },
  { name: "Rotli (1 medium)", kcal: 85, protein: 2.8, carbs: 17, fat: 0.7 },
  { name: "Chapati (1 medium)", kcal: 80, protein: 2.5, carbs: 15, fat: 1 },
  { name: "Naan (1 medium)", kcal: 262, protein: 8.7, carbs: 45, fat: 5.1 },
  { name: "Peanut Butter 1 tbsp", kcal: 94, protein: 4, carbs: 3.1, fat: 8 },
  { name: "Almonds 30g", kcal: 173, protein: 6.3, carbs: 6, fat: 15 },
  { name: "Almonds 5 nuts", kcal: 35, protein: 1.3, carbs: 1.2, fat: 3 },
  { name: "Sweet Potato 100g", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Broccoli 100g", kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Spinach 100g", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Dal 100g (cooked)", kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Biryani 200g", kcal: 320, protein: 18, carbs: 42, fat: 8 },
  { name: "Samosa (1)", kcal: 150, protein: 3, carbs: 18, fat: 8 },
  { name: "Gathiya 20g", kcal: 100, protein: 2.8, carbs: 10, fat: 5.6 },
  { name: "Crispy Bhindi 30g", kcal: 40, protein: 1.2, carbs: 4.2, fat: 1.5 },
  { name: "Pizza slice", kcal: 250, protein: 10, carbs: 32, fat: 9 },
  { name: "Whey Protein 25g", kcal: 109, protein: 17, carbs: 1.2, fat: 4 },
  { name: "Protein Bar (avg)", kcal: 200, protein: 20, carbs: 22, fat: 7 },
  { name: "KP Peanuts 30g", kcal: 177, protein: 8.5, carbs: 3.4, fat: 13.8 },
  { name: "Nasto mix 30g", kcal: 143, protein: 2, carbs: 17, fat: 7 },
  { name: "Actimel 100ml", kcal: 73, protein: 3, carbs: 11, fat: 1.5 },
  { name: "Soya Crispies 30g", kcal: 109, protein: 22.5, carbs: 2.3, fat: 0.7 },
  { name: "Coffee (black)", kcal: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: "Orange Juice 200ml", kcal: 84, protein: 1.2, carbs: 20, fat: 0.2 },
  { name: "Creatine 3g", kcal: 0, protein: 0, carbs: 0, fat: 0 },
];

const SUPPLEMENTS = [
  { id: "vitd", label: "Vitamin D", time: "Morning", emoji: "☀️", color: "#f59e0b" },
  { id: "iq", label: "IQ Supplement", time: "Morning", emoji: "🧠", color: "#3b82f6" },
  { id: "ashwa", label: "Ashwagandha KSM-66", time: "With Dinner", emoji: "🌿", color: "#22c55e" },
  { id: "mag", label: "Magnesium Glycinate", time: "Before Bed", emoji: "😴", color: "#a855f7" },
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

const CARDIO_TYPES = ["Incline Walk", "Treadmill", "Cross Trainer", "Cycling", "Rowing", "Running (outdoor)", "HIIT", "Swimming"];

// ── Helpers ────────────────────────────────────────────────────────────────

const getToday = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; } };
const fmtDateLong = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); } catch { return d; } };
const dayLabel = (d) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" }); } catch { return d; } };
const mealTotal = (meal) => meal.items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

const compress = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Read failed"));
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Image failed"));
    img.onload = () => {
      try {
        const maxW = 480; const scale = Math.min(1, maxW / img.width);
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
const fbSet = async (col, id, data) => { try { await setDoc(userDoc(col, id), data); } catch (e) { console.error(e); } };
const fbDel = async (col, id) => { try { await deleteDoc(userDoc(col, id)); } catch {} };
const fbGetAll = async (col) => { try { const snap = await getDocs(collection(db, "users", UID, col)); return snap.docs.map(d => ({ id: d.id, ...d.data() })); } catch { return []; } };

// ── Shared UI ──────────────────────────────────────────────────────────────

function Ring({ value, max, color, size, stroke, children }) {
  const s = size || 90; const st = stroke || 9;
  const r = (s - st) / 2; const circ = 2 * Math.PI * r; const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: s, height: s, flexShrink: 0 }}>
      <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={st} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth={st} strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background:"#fff", borderRadius:18, padding:"16px 18px", marginBottom:12, boxShadow:"0 2px 12px rgba(0,0,0,0.05)", border:"1px solid #f0eee8", ...(style||{}) }}>{children}</div>;
}

function MiniBar({ value, max, color }) {
  return <div style={{ height:4, background:"rgba(255,255,255,0.12)", borderRadius:99 }}><div style={{ height:"100%", width:`${Math.min(value/max*100,100)}%`, background:color, borderRadius:99 }} /></div>;
}

function MacroPills({ kcal, protein, carbs, fat }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginTop:8 }}>
      {[["Kcal",Math.round(kcal),"#e85d26"],["P",Math.round(protein)+"g","#22c55e"],["C",Math.round(carbs)+"g","#60a5fa"],["F",Math.round(fat)+"g","#f59e0b"]].map(([l,v,c])=>(
        <div key={l} style={{ textAlign:"center", background:"#f8f6f2", borderRadius:8, padding:"5px 2px" }}>
          <div style={{ fontSize:11, fontWeight:800, color:c }}>{v}</div>
          <div style={{ fontSize:9, color:"#aaa" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{ position:"fixed", top:28, left:"50%", transform:"translateX(-50%)", background:"#22c55e", color:"#fff", padding:"12px 22px", borderRadius:99, fontSize:13, fontWeight:700, zIndex:99999, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", whiteSpace:"nowrap", pointerEvents:"none" }}>{msg}</div>;
}

function DarkHeader({ tag, title, children }) {
  return (
    <div style={{ background:"linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", padding:"48px 20px 20px", color:"#fff" }}>
      <div style={{ fontSize:10, color:"#e85d26", fontFamily:"monospace", letterSpacing:3, marginBottom:8 }}>{tag}</div>
      <div style={{ fontSize:24, fontWeight:900, marginBottom:16 }}>{title}</div>
      {children}
    </div>
  );
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #eee", overflowX:"auto" }}>
      {tabs.map(([key,label])=>(
        <button key={key} type="button" onClick={()=>onChange(key)} style={{ flexShrink:0, padding:"12px 14px", border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"monospace", color:active===key?"#e85d26":"#aaa", borderBottom:`2.5px solid ${active===key?"#e85d26":"transparent"}` }}>{label}</button>
      ))}
    </div>
  );
}

function DateNav({ date, onChange }) {
  const isToday = date === getToday();
  function back() { const d=new Date(date+"T00:00:00"); d.setDate(d.getDate()-1); onChange(d.toISOString().split("T")[0]); }
  function fwd() { const d=new Date(date+"T00:00:00"); d.setDate(d.getDate()+1); const n=d.toISOString().split("T")[0]; if(n<=getToday()) onChange(n); }
  return (
    <div>
      <div style={{ background:"#fff", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid #eee" }}>
        <button type="button" onClick={back} style={{ width:36, height:36, borderRadius:10, border:"1.5px solid #eee", background:"#f8f6f2", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{"<"}</button>
        <input type="date" value={date} max={getToday()} onChange={e=>e.target.value&&onChange(e.target.value)}
          style={{ flex:1, padding:"8px 12px", borderRadius:10, border:`1.5px solid ${isToday?"#22c55e":"#f59e0b"}`, fontSize:14, fontFamily:"inherit", outline:"none", background:isToday?"#f0fdf4":"#fff7ed", textAlign:"center", fontWeight:700, color:isToday?"#22c55e":"#e85d26" }} />
        <button type="button" onClick={fwd} disabled={isToday} style={{ width:36, height:36, borderRadius:10, border:"1.5px solid #eee", background:isToday?"#f0f0f0":"#f8f6f2", cursor:isToday?"not-allowed":"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:isToday?"#ccc":"#333" }}>{">"}</button>
        {!isToday&&<button type="button" onClick={()=>onChange(getToday())} style={{ padding:"6px 12px", borderRadius:10, background:"#1a1a2e", color:"#fff", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>Today</button>}
      </div>
      {!isToday&&<div style={{ background:"#fff7ed", padding:"8px 14px", fontSize:12, color:"#e85d26", fontWeight:600, textAlign:"center" }}>Editing: {fmtDateLong(date)}</div>}
    </div>
  );
}

// ── Weekly Analysis (shared) ────────────────────────────────────────────────

function WeeklyAnalysisCard({ sessions, weeklyData }) {
  const [copied, setCopied] = useState(false);

  function buildReport() {
    const weekSessions = sessions.filter(s => { const d=new Date(s.date+"T00:00:00"); const w=new Date(); w.setDate(w.getDate()-7); return d>=w; });
    const activeDays = weeklyData.filter(d=>d.kcal>0);
    const avgKcal = activeDays.length>0 ? Math.round(activeDays.reduce((s,d)=>s+d.kcal,0)/activeDays.length) : 0;
    const avgProt = activeDays.length>0 ? Math.round(activeDays.reduce((s,d)=>s+d.protein,0)/activeDays.length) : 0;
    const weights = weeklyData.filter(d=>d.weight).map(d=>d.weight);
    const wChange = weights.length>=2 ? (weights[weights.length-1]-weights[0]).toFixed(1) : null;

    let r = "=== WEEKLY FITNESS REPORT ===\nWeek ending: "+new Date().toLocaleDateString("en-GB")+"\n\n";
    r += "ABOUT ME:\nAge 28, 168cm, starting weight 67kg, UK dentist\n";
    r += "Goal: Body recomposition - reduce body fat from 22.7% to 12-14% (visible abs)\n";
    r += "Diet: Vegetarian, no eggs. Calorie target: 1950 kcal | Protein: 134g\n\n";
    r += "--- NUTRITION ---\n";
    r += "Avg daily calories: "+avgKcal+" kcal (target: 1950)\n";
    r += "Avg daily protein: "+avgProt+"g (target: 134g)\n";
    r += "Days tracked: "+activeDays.length+"/7\n";
    r += "Daily breakdown:\n";
    weeklyData.forEach(d=>{ r += "  "+d.shortLabel+": "+d.kcal+" kcal, "+d.protein+"g protein\n"; });
    r += "\n--- BODY WEIGHT ---\n";
    if (weights.length>0) { r += "Latest weight: "+weights[weights.length-1]+"kg\n"; if(wChange) r += "Change this week: "+wChange+"kg\n"; }
    else r += "No weight logged this week\n";
    r += "\n--- TRAINING ("+weekSessions.length+" sessions) ---\n";
    if (weekSessions.length===0) r += "No training sessions logged\n";
    else weekSessions.forEach(s => {
      r += "\n"+fmtDate(s.date)+" - "+s.sessionName+" ("+s.mode+")\n";
      if (s.mode==="cardio") {
        r += "  "+s.cardioData?.type+": "+s.cardioData?.duration+" mins"+(s.cardioData?.distance?", "+s.cardioData.distance+"km":"")+"\n";
      } else {
        s.exercises?.forEach(ex => {
          r += "  "+ex.name+":\n";
          ex.sets.forEach((set,i) => { r += "    Set "+(i+1)+": "+set.reps+" reps"+(set.weight?" @ "+set.weight+"kg":"")+"\n"; });
        });
        if (s.totalVolume>0) r += "  Total volume: "+Math.round(s.totalVolume)+"kg\n";
      }
    });
    r += "\n=== END ===\nPlease analyse my week:\n1. Body recomposition progress\n2. Strength/fitness progress\n3. Nutrition consistency\n4. Specific recommendations for next week";
    return r;
  }

  function copy() {
    navigator.clipboard.writeText(buildReport()).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),3000); }).catch(()=>{});
  }

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>🧠 Weekly Analysis</div>
          <div style={{ fontSize:11, color:"#888", marginTop:2 }}>Copy report → paste to Claude for full analysis</div>
        </div>
        <button type="button" onClick={copy} style={{ padding:"10px 16px", background:copied?"#22c55e":"#1a1a2e", color:"#fff", border:"none", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          {copied?"✅ Copied!":"📋 Copy Report"}
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          ["Sessions", weeklyData.reduce((s,d)=>s+(d.sessions||0),0)+" this week", "#22c55e"],
          ["Avg Kcal", weeklyData.filter(d=>d.kcal>0).length>0?Math.round(weeklyData.reduce((s,d)=>s+d.kcal,0)/weeklyData.filter(d=>d.kcal>0).length)+" kcal":"–", "#e85d26"],
          ["Avg Prot", weeklyData.filter(d=>d.protein>0).length>0?Math.round(weeklyData.reduce((s,d)=>s+d.protein,0)/weeklyData.filter(d=>d.protein>0).length)+"g":"–", "#60a5fa"],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:"#f8f6f2", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:9, color:"#aaa", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({ totals, suppLog, weightLog, weeklyData, sessions, onExport, waterLog, onLogWater }) {
  const hr = new Date().getHours();
  const greeting = hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const dateStr = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const latest = weightLog.length>0?weightLog[weightLog.length-1].weight:null;
  const change = latest?(latest-67).toFixed(1):null;
  const remaining = Math.max(Math.round(TARGETS.kcal-totals.kcal),0);
  const weekAvgKcal = weeklyData.filter(d=>d.kcal>0).length>0?Math.round(weeklyData.reduce((s,d)=>s+d.kcal,0)/weeklyData.filter(d=>d.kcal>0).length):0;
  const weekTrainCount = sessions.filter(s=>{ const d=new Date(s.date+"T00:00:00"); const w=new Date(); w.setDate(w.getDate()-7); return d>=w; }).length;

  return (
    <div>
      <div style={{ background:"linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", padding:"48px 20px 24px", color:"#fff" }}>
        <div style={{ fontSize:10, color:"#e85d26", fontFamily:"monospace", letterSpacing:3, marginBottom:8 }}>MY FITNESS HUB</div>
        <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{greeting} Parth 👋</div>
        <div style={{ fontSize:12, color:"#8899bb", marginBottom:22 }}>{dateStr}</div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:18, padding:18, display:"flex", gap:18, alignItems:"center" }}>
          <Ring value={totals.kcal} max={TARGETS.kcal} color="#e85d26" size={90} stroke={9}>
            <div style={{ fontSize:17, fontWeight:900, color:"#fff", lineHeight:1 }}>{Math.round(totals.kcal)}</div>
            <div style={{ fontSize:9, color:"#8899bb", marginTop:2 }}>kcal</div>
          </Ring>
          <div style={{ flex:1 }}>
            {[["Protein",totals.protein,TARGETS.protein,"#22c55e"],["Carbs",totals.carbs,TARGETS.carbs,"#60a5fa"],["Fat",totals.fat,TARGETS.fat,"#f59e0b"]].map(([l,v,t,c])=>(
              <div key={l} style={{ marginBottom:9 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                  <span style={{ color:"#8899bb" }}>{l}</span>
                  <span style={{ color:c, fontWeight:700 }}>{Math.round(v)}g / {t}g</span>
                </div>
                <MiniBar value={v} max={t} color={c} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 14px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
          <Card style={{ margin:0, textAlign:"center", padding:"12px 8px" }}>
            <div style={{ fontSize:9, color:"#aaa", fontFamily:"monospace", marginBottom:4 }}>KCAL LEFT</div>
            <div style={{ fontSize:22, fontWeight:900, color:remaining>0?"#e85d26":"#22c55e" }}>{remaining}</div>
          </Card>
          <Card style={{ margin:0, textAlign:"center", padding:"12px 8px" }}>
            <div style={{ fontSize:9, color:"#aaa", fontFamily:"monospace", marginBottom:4 }}>WEIGHT</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#1a1a2e" }}>{latest?latest:"–"}<span style={{ fontSize:11 }}>{latest?"kg":""}</span></div>
            {change&&<div style={{ fontSize:9, color:parseFloat(change)<=0?"#22c55e":"#e85d26" }}>{parseFloat(change)<=0?"↓":"↑"}{Math.abs(change)}kg</div>}
          </Card>
          <Card style={{ margin:0, textAlign:"center", padding:"12px 8px" }}>
            <div style={{ fontSize:9, color:"#aaa", fontFamily:"monospace", marginBottom:4 }}>TRAINED</div>
            <div style={{ fontSize:22, fontWeight:900, color:weekTrainCount>0?"#22c55e":"#aaa" }}>{weekTrainCount}</div>
            <div style={{ fontSize:9, color:"#aaa" }}>this week</div>
          </Card>
        </div>

        <WeeklyAnalysisCard sessions={sessions} weeklyData={weeklyData} />

        {weeklyData.length>0&&(
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>📊 7-Day Calories</div>
            <div style={{ fontSize:11, color:"#888", marginBottom:12 }}>Avg: {weekAvgKcal} kcal · Target: {TARGETS.kcal}</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={weeklyData} margin={{top:0,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="shortLabel" tick={{fontSize:10,fill:"#aaa"}}/>
                <YAxis tick={{fontSize:9,fill:"#aaa"}} domain={[0,Math.max(TARGETS.kcal*1.2,500)]}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+" kcal","Calories"]}/>
                <ReferenceLine y={TARGETS.kcal} stroke="#e85d2660" strokeDasharray="4 4"/>
                <Bar dataKey="kcal" fill="#e85d26" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {weeklyData.length>0&&(
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>💪 7-Day Protein</div>
            <div style={{ fontSize:11, color:"#888", marginBottom:12 }}>Target: {TARGETS.protein}g/day</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={weeklyData} margin={{top:0,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="shortLabel" tick={{fontSize:10,fill:"#aaa"}}/>
                <YAxis tick={{fontSize:9,fill:"#aaa"}} domain={[0,180]}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+"g","Protein"]}/>
                <ReferenceLine y={TARGETS.protein} stroke="#22c55e60" strokeDasharray="4 4"/>
                <Bar dataKey="protein" fill="#22c55e" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>💊 Supplements</div>
            <div style={{ fontSize:13, fontWeight:800, color:suppLog.length===SUPPLEMENTS.length?"#22c55e":"#e85d26" }}>{suppLog.length}/{SUPPLEMENTS.length}</div>
          </div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {SUPPLEMENTS.map(s=>(
              <div key={s.id} style={{ padding:"5px 12px", borderRadius:99, background:suppLog.includes(s.id)?s.color+"20":"#f5f5f5", border:`1.5px solid ${suppLog.includes(s.id)?s.color+"40":"#eee"}`, fontSize:11, color:suppLog.includes(s.id)?s.color:"#bbb", fontWeight:600 }}>
                {suppLog.includes(s.id)?"✓ ":""}{s.label.split(" ")[0]}
              </div>
            ))}
          </div>
        </Card>


        {/* Water tracker */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>💧 Water Intake</div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{waterLog * 250}ml of 2,500ml</div>
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:waterLog>=10?"#22c55e":"#60a5fa" }}>{waterLog}/10 glasses</div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {Array.from({length:10},(_,i)=>(
              <button key={i} type="button" onClick={()=>onLogWater(waterLog===i+1?i:i+1)}
                style={{ width:40, height:40, borderRadius:10, border:`2px solid ${i<waterLog?"#60a5fa":"#e0e0e0"}`, background:i<waterLog?"#eff6ff":"#f8f8f8", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i<waterLog?"💧":"○"}
              </button>
            ))}
          </div>
          <div style={{ height:6, background:"#f0f0f0", borderRadius:99 }}>
            <div style={{ height:"100%", width:`${Math.min(waterLog/10*100,100)}%`, background:"linear-gradient(to right,#60a5fa,#3b82f6)", borderRadius:99, transition:"width 0.3s" }}/>
          </div>
          {waterLog>=10&&<div style={{ fontSize:12, color:"#22c55e", fontWeight:700, textAlign:"center", marginTop:8 }}>🎉 Daily target reached!</div>}
        </Card>
        <button type="button" onClick={onExport} style={{ width:"100%", padding:"13px", background:"#f8f6f2", border:"1.5px solid #eee", borderRadius:13, fontSize:13, fontWeight:700, cursor:"pointer", color:"#666", marginBottom:12 }}>
          📥 Export All Data (JSON)
        </button>
      </div>
    </div>
  );
}

// ── Log Tab ─────────────────────────────────────────────────────────────────

function LogTab({ foodLog, totals, onAdd, onRemove, myFoods, onSaveFood, onDeleteMyFood, meals, onSaveMeals, globalDate, onDateChange }) {
  const [subTab, setSubTab] = useState("quick");
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [toast, setToast] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [manual, setManual] = useState({ name:"", kcal:"", protein:"", carbs:"", fat:"" });
  const [editingMeal, setEditingMeal] = useState(null); // meal id being edited
  const [newItem, setNewItem] = useState({ name:"", kcal:"", protein:"", carbs:"", fat:"" });

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2500); }

  function logItem(name, kcal, protein, carbs, fat) {
    onAdd({ id:Date.now()+"_"+Math.random(), name:String(name), kcal:Number(kcal)||0, protein:Number(protein)||0, carbs:Number(carbs)||0, fat:Number(fat)||0 });
    showToast("✅ "+name+" added!");
  }

  function handleSearch(q) {
    setSearchQ(q);
    if (!q.trim()) { setSearchRes([]); return; }
    setSearchRes(FOOD_DB.filter(f=>f.name.toLowerCase().includes(q.toLowerCase())).slice(0,8));
  }

  function submitManual() {
    if (!manual.name.trim()||!manual.kcal) return;
    logItem(manual.name, manual.kcal, manual.protein, manual.carbs, manual.fat);
    setManual({ name:"", kcal:"", protein:"", carbs:"", fat:"" });
  }

  function removeMealItem(mealId, itemIdx) {
    const updated = meals.map(m => m.id===mealId ? { ...m, items:m.items.filter((_,i)=>i!==itemIdx) } : m);
    onSaveMeals(updated);
  }

  function addMealItem(mealId) {
    if (!newItem.name.trim()||!newItem.kcal) return;
    const item = { name:newItem.name, kcal:Number(newItem.kcal)||0, protein:Number(newItem.protein)||0, carbs:Number(newItem.carbs)||0, fat:Number(newItem.fat)||0 };
    const updated = meals.map(m => m.id===mealId ? { ...m, items:[...m.items, item] } : m);
    onSaveMeals(updated);
    setNewItem({ name:"", kcal:"", protein:"", carbs:"", fat:"" });
    showToast("✅ Item added to meal!");
  }

  function resetMeal(mealId) {
    const def = DEFAULT_MEALS.find(m=>m.id===mealId);
    if (!def) return;
    const updated = meals.map(m => m.id===mealId ? { ...m, items:[...def.items] } : m);
    onSaveMeals(updated);
    showToast("✅ Meal reset to default");
  }

  const tabs = [["quick","⚡ Meals"],["myfoods","⭐ My Foods ("+myFoods.length+")"],["search","🔍 Search"],["manual","✏️ Manual"],["log","📋 Log ("+foodLog.length+")"]];

  return (
    <div>
      <Toast msg={toast}/>
      <DarkHeader tag="FOOD TRACKER" title="Log Food 📝">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, background:"rgba(255,255,255,0.06)", borderRadius:14, padding:12 }}>
          {[["Kcal",Math.round(totals.kcal),"#e85d26"],["Prot",Math.round(totals.protein)+"g","#22c55e"],["Carb",Math.round(totals.carbs)+"g","#60a5fa"],["Fat",Math.round(totals.fat)+"g","#f59e0b"]].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:"#667", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </DarkHeader>

      <DateNav date={globalDate} onChange={onDateChange} />
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab}/>

      <div style={{ padding:"14px 14px 0" }}>

        {subTab==="quick"&&(
          <div>
            {meals.map(meal=>{
              const tot = mealTotal(meal);
              const isEditing = editingMeal===meal.id;
              return (
                <Card key={meal.id}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#aaa", fontFamily:"monospace", marginBottom:2 }}>{meal.time}</div>
                      <div style={{ fontSize:16, fontWeight:700 }}>{meal.emoji} {meal.label}</div>
                      <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{Math.round(tot.kcal)} kcal · {Math.round(tot.protein)}g protein</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button type="button" onClick={()=>setEditingMeal(isEditing?null:meal.id)} style={{ padding:"8px 12px", background:isEditing?"#f59e0b":"#f0f4ff", color:isEditing?"#fff":"#3b82f6", border:"none", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                        {isEditing?"Done ✓":"✏️ Edit"}
                      </button>
                      <button type="button" onClick={()=>logItem(meal.label,tot.kcal,tot.protein,tot.carbs,tot.fat)} style={{ padding:"8px 14px", background:"#e85d26", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700, minHeight:40 }}>+ All</button>
                    </div>
                  </div>

                  {/* Edit mode */}
                  {isEditing&&(
                    <div style={{ background:"#f0f4ff", borderRadius:12, padding:12, marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#3b82f6", marginBottom:10 }}>✏️ Editing {meal.label}</div>
                      {meal.items.map((item,idx)=>(
                        <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, background:"#fff", borderRadius:10, padding:"8px 10px" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>{item.name}</div>
                            <div style={{ fontSize:10, color:"#888" }}>{item.kcal} kcal · {item.protein}g P</div>
                          </div>
                          <button type="button" onClick={()=>removeMealItem(meal.id,idx)} style={{ width:28, height:28, borderRadius:"50%", background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:13 }}>✕</button>
                        </div>
                      ))}
                      <div style={{ marginTop:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#3b82f6", marginBottom:8 }}>+ Add item to {meal.label}</div>
                        <input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Item name *" type="text"
                          style={{ width:"100%", padding:"9px 10px", borderRadius:9, border:"1.5px solid #ddd", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff", marginBottom:8, boxSizing:"border-box" }}/>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                          {[["kcal","Kcal *","#e85d26"],["protein","P (g)","#22c55e"],["carbs","C (g)","#60a5fa"],["fat","F (g)","#f59e0b"]].map(([k,l,c])=>(
                            <div key={k}>
                              <div style={{ fontSize:9, color:c, marginBottom:3, fontFamily:"monospace", fontWeight:700 }}>{l}</div>
                              <input type="number" value={newItem[k]} onChange={e=>setNewItem(p=>({...p,[k]:e.target.value}))} placeholder="0"
                                style={{ width:"100%", padding:"8px", borderRadius:8, border:"1.5px solid #ddd", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff", boxSizing:"border-box" }}/>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                          <button type="button" onClick={()=>addMealItem(meal.id)} style={{ padding:"10px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 }}>+ Add Item</button>
                          <button type="button" onClick={()=>resetMeal(meal.id)} style={{ padding:"10px", background:"#fff0f0", color:"#ef4444", border:"1.5px solid #fecaca", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 }}>Reset to Default</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual items expand */}
                  {!isEditing&&(
                    <button type="button" onClick={()=>setExpandedMeal(expandedMeal===meal.id?null:meal.id)} style={{ width:"100%", padding:"10px", background:"#f8f6f2", border:"none", borderRadius:10, cursor:"pointer", fontSize:12, color:"#666", fontWeight:600 }}>
                      {expandedMeal===meal.id?"▲ Hide items":"▼ Add individual items"}
                    </button>
                  )}
                  {!isEditing&&expandedMeal===meal.id&&(
                    <div style={{ marginTop:10 }}>
                      {meal.items.map((item,idx)=>(
                        <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, background:"#f8f6f2", borderRadius:12, padding:"12px", marginBottom:8 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>{item.name}</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
                              {[["Kcal",item.kcal,"#e85d26"],["P",item.protein+"g","#22c55e"],["C",item.carbs+"g","#60a5fa"],["F",item.fat+"g","#f59e0b"]].map(([l,v,c])=>(
                                <div key={l} style={{ textAlign:"center", background:"#fff", borderRadius:7, padding:"4px 2px" }}>
                                  <div style={{ fontSize:11, fontWeight:800, color:c }}>{typeof v==="number"?Math.round(v):v}</div>
                                  <div style={{ fontSize:9, color:"#aaa" }}>{l}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button type="button" onClick={()=>logItem(item.name,item.kcal,item.protein,item.carbs,item.fat)} style={{ width:48, height:48, borderRadius:12, background:"#1a1a2e", color:"#fff", border:"none", cursor:"pointer", fontSize:24, flexShrink:0 }}>+</button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {subTab==="myfoods"&&(
          <div>
            {myFoods.length===0?(
              <Card><div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#888", marginBottom:6 }}>No saved foods yet</div>
                <div style={{ fontSize:12, color:"#aaa" }}>Add foods in ✏️ Manual tab then tap "Save to My Foods"</div>
              </div></Card>
            ):(
              <div>
                <div style={{ fontSize:12, color:"#888", marginBottom:12 }}>Tap + to add to today's log</div>
                {myFoods.map((food,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#fff", borderRadius:14, padding:"12px 14px", marginBottom:8, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #f0eee8" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>⭐ {food.name}</div>
                      <div style={{ display:"flex", gap:8, fontSize:11 }}>
                        <span style={{ color:"#e85d26", fontWeight:700 }}>{food.kcal} kcal</span>
                        <span style={{ color:"#22c55e" }}>{food.protein}g P</span>
                        <span style={{ color:"#60a5fa" }}>{food.carbs}g C</span>
                        <span style={{ color:"#f59e0b" }}>{food.fat}g F</span>
                      </div>
                    </div>
                    <button type="button" onClick={()=>onDeleteMyFood(food.name)} style={{ width:32, height:32, borderRadius:"50%", background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:14 }}>✕</button>
                    <button type="button" onClick={()=>logItem(food.name,food.kcal,food.protein,food.carbs,food.fat)} style={{ width:44, height:44, borderRadius:12, background:"#e85d26", color:"#fff", border:"none", cursor:"pointer", fontSize:22 }}>+</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab==="search"&&(
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>🔍 Food Search</div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14 }}>{FOOD_DB.length} common UK & Indian foods</div>
            <input value={searchQ} onChange={e=>handleSearch(e.target.value)} placeholder="e.g. banana, dal, paneer, gathiya…"
              style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:"1.5px solid #eee", fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box", marginBottom:10 }}/>
            {searchRes.map((food,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"#f8f6f2", borderRadius:12, padding:"12px", marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{food.name}</div>
                  <div style={{ display:"flex", gap:8, fontSize:11 }}>
                    <span style={{ color:"#e85d26", fontWeight:700 }}>{food.kcal} kcal</span>
                    <span style={{ color:"#22c55e" }}>{food.protein}g P</span>
                    <span style={{ color:"#60a5fa" }}>{food.carbs}g C</span>
                    <span style={{ color:"#f59e0b" }}>{food.fat}g F</span>
                  </div>
                </div>
                <button type="button" onClick={()=>logItem(food.name,food.kcal,food.protein,food.carbs,food.fat)} style={{ width:44, height:44, borderRadius:12, background:"#e85d26", color:"#fff", border:"none", cursor:"pointer", fontSize:22 }}>+</button>
              </div>
            ))}
            {searchQ&&searchRes.length===0&&<div style={{ textAlign:"center", padding:"20px", color:"#aaa", fontSize:13 }}>No results. Try Manual Entry.</div>}
          </Card>
        )}

        {subTab==="manual"&&(
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>✏️ Manual Entry</div>
            <div style={{ fontSize:11, color:"#888", marginBottom:14 }}>Enter macros from a food label or menu.</div>
            <input value={manual.name} onChange={e=>setManual(p=>({...p,name:e.target.value}))} placeholder="Food name *" type="text"
              style={{ width:"100%", padding:"12px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa", marginBottom:10, boxSizing:"border-box" }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {[["Calories (kcal) *","kcal","#e85d26"],["Protein (g)","protein","#22c55e"],["Carbs (g)","carbs","#60a5fa"],["Fat (g)","fat","#f59e0b"]].map(([label,key,color])=>(
                <div key={key}>
                  <div style={{ fontSize:10, color, marginBottom:4, fontFamily:"monospace", fontWeight:700 }}>{label}</div>
                  <input type="number" value={manual[key]} onChange={e=>setManual(p=>({...p,[key]:e.target.value}))} placeholder="0"
                    style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box" }}/>
                </div>
              ))}
            </div>
            {manual.name&&manual.kcal&&(
              <div style={{ marginBottom:12, background:"#f8f6f2", borderRadius:10, padding:"10px 12px" }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{manual.name}</div>
                <MacroPills kcal={manual.kcal} protein={manual.protein||0} carbs={manual.carbs||0} fat={manual.fat||0}/>
              </div>
            )}
            <button type="button" onClick={submitManual} style={{ width:"100%", padding:"14px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:13, fontSize:14, fontWeight:700, cursor:"pointer", minHeight:50, marginBottom:8 }}>+ Add to Log</button>
            {manual.name&&manual.kcal&&(
              <button type="button" onClick={()=>{ onSaveFood({name:manual.name,kcal:Number(manual.kcal)||0,protein:Number(manual.protein)||0,carbs:Number(manual.carbs)||0,fat:Number(manual.fat)||0}); showToast("⭐ "+manual.name+" saved!"); }} style={{ width:"100%", padding:"12px", background:"#f59e0b", color:"#fff", border:"none", borderRadius:13, fontSize:13, fontWeight:700, cursor:"pointer" }}>⭐ Save to My Foods</button>
            )}
          </Card>
        )}

        {subTab==="log"&&(
          <div>
            {foodLog.length===0?(
              <div style={{ textAlign:"center", padding:"50px 20px", color:"#bbb" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#888" }}>Nothing logged for {globalDate===getToday()?"today":fmtDateLong(globalDate)}</div>
                <div style={{ fontSize:12, color:"#aaa", marginTop:6 }}>Use the other tabs to add food</div>
              </div>
            ):(
              <>
                <Card style={{ background:"#1a1a2e", border:"none" }}>
                  <div style={{ fontSize:10, color:"#8899bb", fontFamily:"monospace", marginBottom:6 }}>TOTAL — {globalDate===getToday()?"TODAY":fmtDateLong(globalDate).toUpperCase()}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    {[["Kcal",Math.round(totals.kcal),TARGETS.kcal,"#e85d26"],["P",Math.round(totals.protein)+"g",TARGETS.protein+"g","#22c55e"],["C",Math.round(totals.carbs)+"g",TARGETS.carbs+"g","#60a5fa"],["F",Math.round(totals.fat)+"g",TARGETS.fat+"g","#f59e0b"]].map(([l,v,t,c])=>(
                      <div key={l} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:c }}>{v}</div>
                        <div style={{ fontSize:9, color:"#667" }}>/ {t}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                {foodLog.map(item=>(
                  <Card key={item.id}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>🍽️ {item.name}</div>
                        <MacroPills kcal={item.kcal} protein={item.protein} carbs={item.carbs} fat={item.fat}/>
                      </div>
                      <button type="button" onClick={()=>onRemove(item.id)} style={{ width:34, height:34, borderRadius:"50%", background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:15, flexShrink:0, marginLeft:10 }}>✕</button>
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

function TrainTab({ sessions, onSaveSession, onDeleteSession, weeklyData, globalDate, onDateChange }) {
  const [subTab, setSubTab] = useState("log");
  const [mode, setMode] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [cardioData, setCardioData] = useState({ type:"Incline Walk", duration:"", distance:"", notes:"" });
  const [customEx, setCustomEx] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const [progressEx, setProgressEx] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2500); }
  const exDb = mode==="weights"?GYM_EXERCISES:mode==="bodyweight"?BW_EXERCISES:{};

  function addExercise(name) { if(!name.trim()||exercises.find(e=>e.name===name)) return; setExercises(prev=>[...prev,{name,sets:[{reps:"",weight:""}]}]); setCustomEx(""); }
  function addSet(i) { setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:[...e.sets,{reps:"",weight:""}]}:e)); }
  function removeSet(i,si) { setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:e.sets.filter((_,s)=>s!==si)}:e)); }
  function updateSet(i,si,field,val) { setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:e.sets.map((s,s2)=>s2===si?{...s,[field]:val}:s)}:e)); }
  function removeExercise(i) { setExercises(prev=>prev.filter((_,ei)=>ei!==i)); }

  async function saveSession() {
    if (mode==="cardio"&&!cardioData.duration) return;
    if ((mode==="weights"||mode==="bodyweight")&&exercises.length===0) return;
    setSaving(true);
    const id = "session_"+Date.now();
    const totalVolume = mode==="weights"?exercises.reduce((s,ex)=>s+ex.sets.reduce((s2,st)=>s2+((Number(st.reps)||0)*(Number(st.weight)||0)),0),0):0;
    const session = { id, date:globalDate, mode, sessionName:sessionName||(mode==="cardio"?cardioData.type:"Session"), exercises:mode!=="cardio"?exercises:[], cardioData:mode==="cardio"?cardioData:null, totalVolume, savedAt:new Date().toISOString() };
    await onSaveSession(session);
    showToast("✅ Session saved!");
    setMode(null); setSessionName(""); setExercises([]); setCardioData({type:"Incline Walk",duration:"",distance:"",notes:""});
    setSaving(false); setSubTab("history");
  }

  function getProgressData(exName) {
    return sessions.filter(s=>s.exercises&&s.exercises.find(e=>e.name===exName)).map(s=>{
      const ex=s.exercises.find(e=>e.name===exName);
      const topWeight=Math.max(...ex.sets.map(st=>Number(st.weight)||0));
      const topReps=ex.sets.find(st=>Number(st.weight)===topWeight)?.reps||0;
      return { date:fmtDate(s.date), weight:topWeight, reps:Number(topReps) };
    }).slice(-12);
  }

  const allExNames = [...new Set(sessions.flatMap(s=>(s.exercises||[]).map(e=>e.name)))];
  function getPB(exName) { const data=getProgressData(exName); if(!data.length) return null; return data.reduce((b,d)=>d.weight>b.weight?d:b,data[0]); }

  const tabs = [["log","📝 Log"],["history","📋 History ("+sessions.length+")"],["progress","📈 Progress"],["analysis","🧠 Analysis"]];

  return (
    <div>
      <Toast msg={toast}/>
      <DarkHeader tag="TRAINING" title="Train 🏋️">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, background:"rgba(255,255,255,0.06)", borderRadius:14, padding:12 }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#e85d26" }}>{sessions.filter(s=>s.date===globalDate).length>0?"✅":"–"}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>Selected day</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#22c55e" }}>{sessions.filter(s=>{ const d=new Date(s.date+"T00:00:00"); const w=new Date(); w.setDate(w.getDate()-7); return d>=w; }).length}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>This week</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#60a5fa" }}>{sessions.length}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>Total</div></div>
        </div>
      </DarkHeader>

      <DateNav date={globalDate} onChange={onDateChange}/>
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab}/>

      <div style={{ padding:"14px 14px 0" }}>

        {subTab==="log"&&(
          <div>
            {!mode?(
              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:16 }}>
                  {globalDate===getToday()?"Log today's session":"Log session for "+fmtDateLong(globalDate)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[["🏋️","Weights","weights","Gym — sets, reps, kg"],["💪","Bodyweight","bodyweight","No equipment"],["🏃","Cardio","cardio","Run, cycle, row"]].map(([emoji,label,val,sub])=>(
                    <button key={val} type="button" onClick={()=>setMode(val)} style={{ padding:"16px 8px", borderRadius:14, border:"2px solid #eee", background:"#f8f6f2", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:28 }}>{emoji}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{label}</span>
                      <span style={{ fontSize:10, color:"#aaa", textAlign:"center" }}>{sub}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ):(
              <div>
                <Card>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{mode==="weights"?"🏋️ Weights":mode==="bodyweight"?"💪 Bodyweight":"🏃 Cardio"}</div>
                    <button type="button" onClick={()=>{setMode(null);setExercises([]);}} style={{ padding:"6px 12px", background:"#f0f0f0", border:"none", borderRadius:8, fontSize:12, cursor:"pointer" }}>✕ Cancel</button>
                  </div>
                  <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder={mode==="cardio"?"Session name (optional)":"e.g. Chest & Triceps"}
                    style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid #eee", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box" }}/>
                </Card>

                {mode==="cardio"&&(
                  <Card>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Cardio Details</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                      {CARDIO_TYPES.map(t=>(
                        <button key={t} type="button" onClick={()=>setCardioData(p=>({...p,type:t}))} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${cardioData.type===t?"#1a1a2e":"#eee"}`, background:cardioData.type===t?"#1a1a2e":"#f8f6f2", color:cardioData.type===t?"#fff":"#666", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t}</button>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:11, color:"#888", marginBottom:4, fontFamily:"monospace" }}>DURATION (mins) *</div>
                        <input type="number" value={cardioData.duration} onChange={e=>setCardioData(p=>({...p,duration:e.target.value}))} placeholder="e.g. 20"
                          style={{ width:"100%", padding:"11px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box" }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:"#888", marginBottom:4, fontFamily:"monospace" }}>DISTANCE (km)</div>
                        <input type="number" step="0.1" value={cardioData.distance} onChange={e=>setCardioData(p=>({...p,distance:e.target.value}))} placeholder="optional"
                          style={{ width:"100%", padding:"11px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    {cardioData.duration&&cardioData.distance&&(
                      <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#22c55e", fontWeight:700 }}>
                        Avg pace: {(Number(cardioData.duration)/Number(cardioData.distance)).toFixed(1)} min/km
                      </div>
                    )}
                    <input type="text" value={cardioData.notes} onChange={e=>setCardioData(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)"
                      style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid #eee", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa", boxSizing:"border-box" }}/>
                  </Card>
                )}

                {(mode==="weights"||mode==="bodyweight")&&(
                  <div>
                    <Card>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Add Exercise</div>
                      {Object.entries(exDb).map(([group,exList])=>(
                        <div key={group} style={{ marginBottom:10 }}>
                          <div style={{ fontSize:11, color:"#aaa", fontFamily:"monospace", marginBottom:6 }}>{group.toUpperCase()}</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {exList.map(ex=>(
                              <button key={ex} type="button" onClick={()=>addExercise(ex)} disabled={!!exercises.find(e=>e.name===ex)} style={{ padding:"6px 12px", borderRadius:99, border:"1.5px solid #eee", background:exercises.find(e=>e.name===ex)?"#e5e5e5":"#f8f6f2", color:exercises.find(e=>e.name===ex)?"#aaa":"#333", fontSize:12, fontWeight:600, cursor:exercises.find(e=>e.name===ex)?"default":"pointer" }}>
                                {ex} {exercises.find(e=>e.name===ex)?"✓":"+"}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div style={{ display:"flex", gap:8, marginTop:10 }}>
                        <input value={customEx} onChange={e=>setCustomEx(e.target.value)} placeholder="Custom exercise…"
                          style={{ flex:1, padding:"10px 12px", borderRadius:10, border:"1.5px solid #eee", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa" }}/>
                        <button type="button" onClick={()=>addExercise(customEx)} style={{ padding:"10px 16px", background:"#1a1a2e", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>Add</button>
                      </div>
                    </Card>
                    {exercises.map((ex,ei)=>(
                      <Card key={ei}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                          <div style={{ fontSize:14, fontWeight:700 }}>{ex.name}</div>
                          <button type="button" onClick={()=>removeExercise(ei)} style={{ width:28, height:28, borderRadius:"50%", background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:13 }}>✕</button>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:mode==="weights"?"40px 1fr 1fr 40px":"40px 1fr 40px", gap:6, marginBottom:8 }}>
                          <div style={{ fontSize:10, color:"#aaa", textAlign:"center", alignSelf:"end", paddingBottom:6 }}>Set</div>
                          <div style={{ fontSize:10, color:"#22c55e", fontFamily:"monospace", alignSelf:"end", paddingBottom:6 }}>REPS</div>
                          {mode==="weights"&&<div style={{ fontSize:10, color:"#60a5fa", fontFamily:"monospace", alignSelf:"end", paddingBottom:6 }}>KG</div>}
                          <div></div>
                        </div>
                        {ex.sets.map((set,si)=>(
                          <div key={si} style={{ display:"grid", gridTemplateColumns:mode==="weights"?"40px 1fr 1fr 40px":"40px 1fr 40px", gap:6, marginBottom:6 }}>
                            <div style={{ textAlign:"center", fontSize:13, color:"#aaa", lineHeight:"40px", fontWeight:700 }}>{si+1}</div>
                            <input type="number" value={set.reps} onChange={e=>updateSet(ei,si,"reps",e.target.value)} placeholder="0"
                              style={{ padding:"10px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, textAlign:"center", fontFamily:"inherit", outline:"none", background:"#fafafa" }}/>
                            {mode==="weights"&&(
                              <input type="number" step="0.5" value={set.weight} onChange={e=>updateSet(ei,si,"weight",e.target.value)} placeholder="0"
                                style={{ padding:"10px", borderRadius:10, border:"1.5px solid #eee", fontSize:14, textAlign:"center", fontFamily:"inherit", outline:"none", background:"#fafafa" }}/>
                            )}
                            <button type="button" onClick={()=>removeSet(ei,si)} style={{ width:36, height:40, borderRadius:10, background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:14 }}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>addSet(ei)} style={{ width:"100%", padding:"8px", background:"#f8f6f2", border:"none", borderRadius:10, cursor:"pointer", fontSize:12, color:"#666", fontWeight:600, marginTop:4 }}>+ Add Set</button>
                      </Card>
                    ))}
                  </div>
                )}

                <button type="button" onClick={saveSession} disabled={saving} style={{ width:"100%", padding:"16px", background:saving?"#aaa":"#22c55e", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer", marginBottom:20 }}>
                  {saving?"Saving…":"✅ Save Session"}
                </button>
              </div>
            )}
          </div>
        )}

        {subTab==="history"&&(
          <div>
            {sessions.length===0?(
              <div style={{ textAlign:"center", padding:"50px 20px" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🏋️</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#888" }}>No sessions logged yet</div>
              </div>
            ):(
              [...sessions].reverse().map(session=>(
                <Card key={session.id}>
                  <div onClick={()=>setExpandedSession(expandedSession===session.id?null:session.id)} style={{ cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontSize:11, color:"#aaa", fontFamily:"monospace", marginBottom:2 }}>{fmtDate(session.date)}</div>
                        <div style={{ fontSize:15, fontWeight:700 }}>{session.mode==="weights"?"🏋️":session.mode==="bodyweight"?"💪":"🏃"} {session.sessionName}</div>
                        <div style={{ fontSize:11, color:"#888", marginTop:3 }}>
                          {session.mode==="cardio"?`${session.cardioData?.duration} mins${session.cardioData?.distance?" · "+session.cardioData.distance+"km":""}`:
                           `${session.exercises?.length} exercises${session.totalVolume>0?" · "+Math.round(session.totalVolume)+"kg volume":""}`}
                        </div>
                      </div>
                      <button type="button" onClick={e=>{e.stopPropagation();onDeleteSession(session.id);}} style={{ width:30, height:30, borderRadius:"50%", background:"#fff0f0", color:"#ef4444", border:"none", cursor:"pointer", fontSize:13 }}>✕</button>
                    </div>
                  </div>
                  {expandedSession===session.id&&(
                    <div style={{ marginTop:12, borderTop:"1px solid #f5f5f5", paddingTop:12 }}>
                      {session.mode==="cardio"?(
                        <div style={{ background:"#f8f6f2", borderRadius:10, padding:12 }}>
                          <div style={{ fontSize:12, color:"#555" }}>Type: {session.cardioData?.type}</div>
                          <div style={{ fontSize:12, color:"#555" }}>Duration: {session.cardioData?.duration} mins</div>
                          {session.cardioData?.distance&&<div style={{ fontSize:12, color:"#555" }}>Distance: {session.cardioData.distance}km</div>}
                          {session.cardioData?.distance&&session.cardioData?.duration&&<div style={{ fontSize:12, color:"#22c55e", fontWeight:700 }}>Pace: {(Number(session.cardioData.duration)/Number(session.cardioData.distance)).toFixed(1)} min/km</div>}
                        </div>
                      ):(
                        session.exercises?.map((ex,i)=>(
                          <div key={i} style={{ marginBottom:10, background:"#f8f6f2", borderRadius:10, padding:10 }}>
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{ex.name}</div>
                            {ex.sets.map((set,si)=><div key={si} style={{ fontSize:12, color:"#555", marginBottom:2 }}>Set {si+1}: {set.reps} reps{set.weight?" @ "+set.weight+"kg":""}</div>)}
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

        {subTab==="progress"&&(
          <div>
            {allExNames.length===0?(
              <div style={{ textAlign:"center", padding:"50px 20px" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📈</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#888" }}>Log weight sessions to track progress</div>
              </div>
            ):(
              <div>
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>🏆 Personal Bests</div>
                  {allExNames.map(exName=>{ const pb=getPB(exName); if(!pb||!pb.weight) return null; return (
                    <div key={exName} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f8f8f8" }}>
                      <span style={{ fontSize:12, color:"#555" }}>{exName}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#e85d26" }}>{pb.weight}kg × {pb.reps} reps</span>
                    </div>
                  );})}
                </Card>
                <Card>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>📈 Strength Progression</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {allExNames.map(ex=>(
                      <button key={ex} type="button" onClick={()=>setProgressEx(ex)} style={{ padding:"6px 12px", borderRadius:99, border:`1.5px solid ${progressEx===ex?"#1a1a2e":"#eee"}`, background:progressEx===ex?"#1a1a2e":"#f8f6f2", color:progressEx===ex?"#fff":"#666", fontSize:11, fontWeight:600, cursor:"pointer" }}>{ex}</button>
                    ))}
                  </div>
                  {progressEx&&getProgressData(progressEx).length>0&&(
                    <div>
                      <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>Top set weight for {progressEx}</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={getProgressData(progressEx)} margin={{top:5,right:10,left:-20,bottom:0}}>
                          <XAxis dataKey="date" tick={{fontSize:9,fill:"#aaa"}}/>
                          <YAxis tick={{fontSize:9,fill:"#aaa"}} domain={["auto","auto"]} unit="kg"/>
                          <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>[v+"kg","Top weight"]}/>
                          <Line type="monotone" dataKey="weight" stroke="#e85d26" strokeWidth={2.5} dot={{fill:"#e85d26",r:5,strokeWidth:0}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {subTab==="analysis"&&<WeeklyAnalysisCard sessions={sessions} weeklyData={weeklyData}/>}
      </div>
    </div>
  );
}


// ── Body Scan Tab ─────────────────────────────────────────────────────────────

function BodyScanTab({ bodyScanLog, onSaveScan }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState("");
  const [tReady, setTReady] = useState(false);
  const today = getToday();
  const baseline = { weight:66.2, bodyFat:22.7, muscleRate:46.3, bmi:23.5, bmr:1394, visceralFat:8 };

  // Load Tesseract.js from CDN once
  useEffect(() => {
    if (window.Tesseract) { setTReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => setTReady(true);
    script.onerror = () => setScanError("Could not load OCR engine. Check your internet connection.");
    document.head.appendChild(script);
  }, []);

  // Extract and OCR a single zone from the canvas
  async function readZone(canvas, x, y, w, h) {
    const scale = 3;
    const zc = document.createElement("canvas");
    zc.width = Math.round(w * scale);
    zc.height = Math.round(h * scale);
    const zctx = zc.getContext("2d");
    zctx.drawImage(canvas, x, y, w, h, 0, 0, zc.width, zc.height);

    // Convert to greyscale + threshold: teal (#3fb8c0 ≈ grey 147) → black, white → white
    const imgData = zctx.getImageData(0, 0, zc.width, zc.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const val = grey < 170 ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = val;
      d[i + 3] = 255;
    }
    zctx.putImageData(imgData, 0, 0);

    try {
      const result = await window.Tesseract.recognize(zc, "eng", {
        tessedit_char_whitelist: "0123456789.",
        tessedit_pageseg_mode: "7",
      });
      const txt = result.data.text.trim();
      const match = txt.match(/[0-9]+\.?[0-9]*/);
      return match ? parseFloat(match[0]) : null;
    } catch { return null; }
  }

  async function analyseScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (!tReady || !window.Tesseract) {
      setScanError("OCR engine still loading — please wait a few seconds and try again.");
      return;
    }
    setScanning(true); setScanResult(null); setScanError(""); setSaved(false);

    try {
      // Load image onto canvas
      setProgress("Loading image…");
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(file);
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Find the white table by scanning for rows with >65% white pixels
      setProgress("Finding table…");
      const pd = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      function whiteRatio(y) {
        let w = 0;
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (pd[i] > 200 && pd[i + 1] > 200 && pd[i + 2] > 200) w++;
        }
        return w / canvas.width;
      }

      // Table starts somewhere between 25-65% down the image
      let tableStart = Math.round(canvas.height * 0.35);
      for (let y = Math.round(canvas.height * 0.25); y < canvas.height * 0.65; y++) {
        if (whiteRatio(y) > 0.65) { tableStart = y; break; }
      }
      // Table ends somewhere between 65-90% down
      let tableEnd = Math.round(canvas.height * 0.82);
      for (let y = Math.round(canvas.height * 0.88); y > tableStart + 50; y--) {
        if (whiteRatio(y) > 0.65) { tableEnd = y; break; }
      }

      const tH = tableEnd - tableStart;
      const rowH = tH / 3;
      const colW = canvas.width / 3;

      // HF Fitness fixed grid layout — always same order:
      // [0] Weight   [1] BFR%    [2] BMI
      // [3] Muscle%  [4] Water%  [5] Bone mass
      // [6] Protein% [7] BMR     [8] Visceral fat
      const METRICS = ["weight","bodyFat","bmi","muscleRate","bodyWater","boneMass","proteinRate","bmr","visceralFat"];
      const results = {};

      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        // Number sits in the lower 45% of each cell, inner 85% of width
        const x = Math.round(col * colW + colW * 0.075);
        const y = Math.round(tableStart + row * rowH + rowH * 0.55);
        const w = Math.round(colW * 0.85);
        const h = Math.round(rowH * 0.4);
        setProgress("Reading " + METRICS[i] + "…");
        results[METRICS[i]] = await readZone(canvas, x, y, w, h);
      }

      // Sanity check — weight should be in human range
      if (!results.weight || results.weight < 30 || results.weight > 200) {
        throw new Error("Could not reliably detect values. Make sure the full results screen is visible.");
      }

      setScanResult({ ...results, date: today });
    } catch(err) {
      setScanError(err.message || "Could not read screenshot. Make sure the HF Fitness results grid is fully visible.");
    }
    setScanning(false); setProgress("");
  }

  async function confirmSave() {
    if (!scanResult) return;
    await onSaveScan(scanResult);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const latest = bodyScanLog.length > 0 ? bodyScanLog[bodyScanLog.length - 1] : null;

  return (
    <div>
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>📷 Upload Body Scan Screenshot</div>
        <div style={{ fontSize:11, color:"#888", marginBottom:16, lineHeight:1.6 }}>
          Take a screenshot of your HF Fitness results → upload here → all values read automatically. No internet required after first load.
        </div>

        {!tReady && (
          <div style={{ background:"#fff7ed", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#e85d26" }}>
            ⏳ Loading OCR engine for the first time… (~5 seconds)
          </div>
        )}

        <div style={{ position:"relative", borderRadius:14, overflow:"hidden", marginBottom:10 }}>
          <div style={{ padding:"18px", background:scanning||!tReady?"#aaa":"#1a1a2e", color:"#fff", textAlign:"center", fontSize:14, fontWeight:700, borderRadius:14, pointerEvents:"none" }}>
            {scanning ? "🔍 " + progress : tReady ? "📱 Upload HF Fitness Screenshot" : "⏳ Loading scanner…"}
          </div>
          <input type="file" accept="image/*" onChange={analyseScreenshot} disabled={scanning||!tReady}
            style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:scanning||!tReady?"not-allowed":"pointer" }}/>
        </div>

        {scanError && (
          <div style={{ fontSize:12, color:"#ef4444", textAlign:"center", padding:"10px", background:"#fff0f0", borderRadius:10 }}>{scanError}</div>
        )}
      </Card>

      {/* Scan result confirmation */}
      {scanResult && !saved && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>✅ Values detected — {fmtDate(scanResult.date)}</div>
          <div style={{ fontSize:11, color:"#888", marginBottom:14 }}>Check these match your HF Fitness screen then save.</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
            {[
              ["Weight", scanResult.weight, "kg"],
              ["Body Fat", scanResult.bodyFat, "%"],
              ["BMI", scanResult.bmi, ""],
              ["Muscle Rate", scanResult.muscleRate, "%"],
              ["Body Water", scanResult.bodyWater, "%"],
              ["Bone Mass", scanResult.boneMass, "kg"],
              ["Protein Rate", scanResult.proteinRate, "%"],
              ["BMR", scanResult.bmr, "kcal"],
              ["Visceral Fat", scanResult.visceralFat, ""],
            ].map(([label, value, unit]) => (
              <div key={label} style={{ background:"#f8f6f2", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"#aaa", fontFamily:"monospace", marginBottom:4 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize:17, fontWeight:800, color:value!=null?"#1a1a2e":"#ddd" }}>
                  {value != null ? value : "–"}<span style={{ fontSize:10, color:"#888" }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={confirmSave} style={{ width:"100%", padding:"14px", background:"#22c55e", color:"#fff", border:"none", borderRadius:13, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            💾 Save to Body Log
          </button>
        </Card>
      )}

      {saved && (
        <Card style={{ background:"#f0fdf4", border:"1px solid #86efac", textAlign:"center", padding:"20px" }}>
          <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#22c55e" }}>Saved successfully!</div>
        </Card>
      )}

      {/* Progress vs baseline */}
      {latest && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>📊 Progress vs Baseline (18 May)</div>
          <div style={{ fontSize:11, color:"#888", marginBottom:14 }}>Latest scan vs starting measurements</div>
          {[
            ["Weight", "weight", "kg", true],
            ["Body Fat", "bodyFat", "%", true],
            ["Muscle Rate", "muscleRate", "%", false],
            ["BMI", "bmi", "", true],
            ["Visceral Fat", "visceralFat", "", true],
            ["BMR", "bmr", "kcal", false],
          ].map(([label, key, unit, lowerBetter]) => {
            if (latest[key] == null) return null;
            const diff = (latest[key] - baseline[key]).toFixed(1);
            const isGood = lowerBetter ? parseFloat(diff) < 0 : parseFloat(diff) > 0;
            const isNeutral = parseFloat(diff) === 0;
            const arrow = parseFloat(diff) < 0 ? "↓" : parseFloat(diff) > 0 ? "↑" : "→";
            const color = isNeutral ? "#888" : isGood ? "#22c55e" : "#e85d26";
            return (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                <span style={{ fontSize:12, color:"#555" }}>{label}</span>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"#1a1a2e" }}>{latest[key]}{unit}</span>
                  <span style={{ fontSize:11, color, fontWeight:700, marginLeft:8 }}>{arrow} {Math.abs(parseFloat(diff))}{unit}</span>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize:11, color:"#aaa", marginTop:10, textAlign:"center" }}>Baseline: 66.2kg · 22.7% BF · 46.3% muscle</div>
        </Card>
      )}

      {/* History */}
      {bodyScanLog.length > 0 && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>📋 Scan History ({bodyScanLog.length} scans)</div>
          {[...bodyScanLog].reverse().map((scan, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #f8f8f8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{fmtDate(scan.date)}</div>
                <div style={{ fontSize:11, color:"#888", marginTop:2 }}>
                  {scan.weight && scan.weight + "kg"}
                  {scan.bodyFat && " · " + scan.bodyFat + "% BF"}
                  {scan.muscleRate && " · " + scan.muscleRate + "% muscle"}
                  {scan.visceralFat && " · VF:" + scan.visceralFat}
                </div>
              </div>
              {scan.weight && (
                <div style={{ fontSize:12, fontWeight:700, color:scan.weight < baseline.weight ? "#22c55e" : "#e85d26" }}>
                  {scan.weight < baseline.weight ? "↓" : "↑"}{Math.abs(scan.weight - baseline.weight).toFixed(1)}kg
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Body Tab ─────────────────────────────────────────────────────────────────

function BodyTab({ weightLog, onAdd, photos, onAddPhoto, onDeletePhoto, bodyScanLog, onSaveScan }) {
  const [bodyTab, setBodyTab] = useState("scan");
  const [weightInput, setWeightInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [photoNote, setPhotoNote] = useState("");
  const today = getToday();
  const todayEntry = weightLog.find(w=>w.date===today);
  const latest = weightLog.length>0?weightLog[weightLog.length-1].weight:null;
  const change = latest?(latest-67).toFixed(1):null;
  const bmi = latest?(latest/(1.68*1.68)).toFixed(1):null;
  const chartData = weightLog.slice(-30).map(w=>({date:fmtDate(w.date),weight:parseFloat(w.weight)}));

  async function handleSave() {
    const w = parseFloat(weightInput);
    if (isNaN(w)||w<30||w>300) return;
    await onAdd({date:today,weight:w});
    setSaved(true); setWeightInput("");
    setTimeout(()=>setSaved(false),2000);
  }

  async function handlePhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try { const dataUrl=await compress(file); await onAddPhoto({id:String(Date.now()),date:today,dataUrl,note:photoNote.trim()}); setPhotoNote(""); }
    catch(err) { alert("Photo failed: "+(err.message||"Unknown")); }
    e.target.value=""; setUploading(false);
  }

  return (
    <div>
      <DarkHeader tag="BODY STATS" title="Body Tracker ⚖️">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, background:"rgba(255,255,255,0.06)", borderRadius:14, padding:12 }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#e85d26" }}>{latest?`${latest}kg`:"–"}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>Current</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:change&&parseFloat(change)<=0?"#22c55e":"#f59e0b" }}>{change?`${parseFloat(change)<=0?"":"+"}${change}kg`:"–"}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>Change</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:"#60a5fa" }}>{bmi||"–"}</div><div style={{ fontSize:9, color:"#667", marginTop:2 }}>BMI</div></div>
        </div>
      </DarkHeader>

      <SubTabs tabs={[["scan","📷 Body Scan"],["weight","⚖️ Weight"],["photos",`📸 Photos (${photos.length})`]]} active={bodyTab} onChange={setBodyTab}/>

      <div style={{ padding:"14px 14px 0" }}>
        {bodyTab==="scan"&&(
          <BodyScanTab bodyScanLog={bodyScanLog} onSaveScan={onSaveScan}/>
        )}
        {bodyTab==="weight"&&(
          <div>
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>{todayEntry?`✅ Today: ${todayEntry.weight}kg`:"Log Today's Weight"}</div>
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" step="0.1" value={weightInput} onChange={e=>setWeightInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder={todayEntry?`Update (was ${todayEntry.weight})`:"e.g. 66.2"}
                  style={{ flex:1, padding:"14px", borderRadius:13, border:"1.5px solid #eee", fontSize:18, fontFamily:"inherit", outline:"none", background:"#fafafa" }}/>
                <button type="button" onClick={handleSave} style={{ padding:"14px 20px", background:"#1a1a2e", color:"#fff", borderRadius:13, border:"none", cursor:"pointer", fontSize:14, fontWeight:700, minWidth:64, minHeight:50 }}>{saved?"✅":"Save"}</button>
              </div>
              <div style={{ fontSize:11, color:"#aaa", marginTop:8 }}>⏰ Weigh yourself first thing in the morning</div>
            </Card>
            {chartData.length>1?(
              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:14 }}>Weight Trend (last 30 days)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <XAxis dataKey="date" tick={{fontSize:9,fill:"#aaa"}}/>
                    <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:"#aaa"}}/>
                    <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                    <ReferenceLine y={67} stroke="#e85d2640" strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="weight" stroke="#1a1a2e" strokeWidth={2.5} dot={{fill:"#e85d26",r:4,strokeWidth:0}}/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize:10, color:"#bbb", textAlign:"center", marginTop:4 }}>Dashed = starting weight 67kg</div>
              </Card>
            ):(
              <Card style={{ textAlign:"center", padding:"28px 20px" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📈</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#888" }}>Log weight daily to see your trend</div>
              </Card>
            )}
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>📋 Your Stats</div>
              {[["Starting Weight","67kg"],["Height","168cm"],["Age","28"],["Calorie Target","1,950 kcal"],["Protein Target","134g/day"],["Body Fat (baseline)","22.7%"],["Visceral Fat (baseline)","8"],["BMI",bmi?bmi:"–"],["Goal","Body recomposition 💪"]].map(([l,v],i,arr)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:i<arr.length-1?"1px solid #f8f8f8":"none" }}>
                  <span style={{ fontSize:12, color:"#888" }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1a1a2e" }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
        {bodyTab==="photos"&&(
          <div>
            <Card>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:4 }}>📸 Add Progress Photo</div>
              <div style={{ fontSize:11, color:"#888", marginBottom:14 }}>Take a photo at the same time daily.</div>
              <input type="text" value={photoNote} onChange={e=>setPhotoNote(e.target.value)} placeholder="Optional note (e.g. Week 3 front)"
                style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid #eee", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fafafa", marginBottom:12, boxSizing:"border-box" }}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[["📷","Take Photo","environment"],["🖼️","Upload",""]].map(([icon,label,capture])=>(
                  <div key={label} style={{ position:"relative", borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"16px 10px", background:label==="Take Photo"?"#1a1a2e":"#f8f6f2", color:label==="Take Photo"?"#fff":"#1a1a2e", textAlign:"center", fontSize:13, fontWeight:700, lineHeight:1.4, border:label!=="Take Photo"?"1.5px solid #eee":"none", pointerEvents:"none" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                      {uploading?"Saving…":label}
                    </div>
                    <input type="file" accept="image/*" {...(capture?{capture}:{})} onChange={handlePhoto} disabled={uploading}
                      style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:uploading?"not-allowed":"pointer" }}/>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10, color:"#bbb", textAlign:"center" }}>Photos saved to Firebase — never lost</div>
            </Card>
            {photos.length===0?(
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#bbb" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📸</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#888" }}>No photos yet</div>
              </div>
            ):(
              <div>
                <div style={{ fontSize:11, color:"#888", marginBottom:10, fontFamily:"monospace" }}>{photos.length} PROGRESS PHOTOS</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[...photos].reverse().map(photo=>(
                    <div key={photo.id} onClick={()=>setViewPhoto(photo)} style={{ cursor:"pointer", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.1)", position:"relative" }}>
                      <img src={photo.dataUrl} alt="Progress" style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", display:"block" }}/>
                      <div style={{ background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%)", padding:"20px 10px 10px", position:"absolute", bottom:0, left:0, right:0 }}>
                        <div style={{ fontSize:11, color:"#fff", fontWeight:700 }}>{fmtDate(photo.date)}</div>
                        {photo.note&&<div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{photo.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewPhoto&&(
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:9999, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", color:"#fff" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{fmtDate(viewPhoto.date)}</div>
                    {viewPhoto.note&&<div style={{ fontSize:11, color:"#aaa" }}>{viewPhoto.note}</div>}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button type="button" onClick={()=>{onDeletePhoto(viewPhoto.id);setViewPhoto(null);}} style={{ padding:"8px 14px", background:"#ef4444", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>Delete</button>
                    <button type="button" onClick={()=>setViewPhoto(null)} style={{ padding:"8px 14px", background:"rgba(255,255,255,0.1)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>✕ Close</button>
                  </div>
                </div>
                <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px 20px" }}>
                  <img src={viewPhoto.dataUrl} alt="Progress" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:12 }}/>
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

function SuppsTab({ suppLog, onToggle, globalDate, onDateChange }) {
  const pct = Math.round((suppLog.length/SUPPLEMENTS.length)*100);
  const isToday = globalDate === getToday();
  const groups = [
    {title:"🌅 Morning", items:SUPPLEMENTS.filter(s=>s.time==="Morning")},
    {title:"🌙 With Dinner", items:SUPPLEMENTS.filter(s=>s.time==="With Dinner")},
    {title:"😴 Before Bed", items:SUPPLEMENTS.filter(s=>s.time==="Before Bed")},
  ];

  return (
    <div>
      <DarkHeader tag="DAILY STACK" title="Supplements 💊">
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:"#8899bb" }}>{isToday?"Today's progress":fmtDateLong(globalDate)}</span>
            <span style={{ fontSize:12, fontWeight:700, color:pct===100?"#22c55e":"#e85d26" }}>{suppLog.length}/{SUPPLEMENTS.length} taken</span>
          </div>
          <div style={{ height:8, background:"rgba(255,255,255,0.1)", borderRadius:99 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#22c55e":"#e85d26", borderRadius:99 }}/>
          </div>
        </div>
      </DarkHeader>

      <DateNav date={globalDate} onChange={onDateChange}/>

      <div style={{ padding:"14px 14px 0" }}>
        {groups.map(group=>(
          <Card key={group.title}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e", marginBottom:12 }}>{group.title}</div>
            {group.items.map(supp=>{ const done=suppLog.includes(supp.id); return (
              <button key={supp.id} type="button" onClick={()=>onToggle(supp.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px", marginBottom:8, borderRadius:13, cursor:"pointer", textAlign:"left", background:done?supp.color+"15":"#f8f6f2", border:`1.5px solid ${done?supp.color+"50":"#f0ece8"}` }}>
                <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, background:done?supp.color:"#e5e5e5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:done?16:18, color:done?"#fff":"#aaa", fontWeight:700 }}>{done?"✓":supp.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:done?supp.color:"#1a1a1a" }}>{supp.label}</div>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:2 }}>{supp.time}</div>
                </div>
                {done&&<div style={{ fontSize:18 }}>✅</div>}
              </button>
            );})}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("home");
  const [globalDate, setGlobalDate] = useState(getToday());
  const [foodLog, setFoodLog] = useState([]);
  const [suppLog, setSuppLog] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [myFoods, setMyFoods] = useState([]);
  const [meals, setMeals] = useState(DEFAULT_MEALS);
  const [sessions, setSessions] = useState([]);
  const [waterLog, setWaterLog] = useState(0);
  const [bodyScanLog, setBodyScanLog] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(()=>{
    (async()=>{
      const today = getToday();
      const fd = await fbGet("food", today);
      const sl = await fbGet("supplements", today);
      const wd = await fbGet("stats", "weight");
      const mf = await fbGet("data", "myfoods");
      const ml = await fbGet("data", "meals");
      const wl = wd?.entries||[];

      setFoodLog(fd?.items||[]);
      setSuppLog(sl?.taken||[]);
      setWeightLog(wl);
      setMyFoods(mf?.items||[]);
      setMeals(ml?.meals||DEFAULT_MEALS);

      const bsl = await fbGet("data", "bodyscans");
      setBodyScanLog(bsl?.scans||[]);

      const wtr = await fbGet("water", today);
      setWaterLog(wtr?.glasses||0);

      const allPhotos = await fbGetAll("photos");
      allPhotos.sort((a,b)=>a.date.localeCompare(b.date));
      setPhotos(allPhotos);

      const allSessions = await fbGetAll("sessions");
      allSessions.sort((a,b)=>a.date.localeCompare(b.date));
      setSessions(allSessions);

      const days = [];
      for (let i=6;i>=0;i--) {
        const d=new Date(); d.setDate(d.getDate()-i);
        const dateStr=d.toISOString().split("T")[0];
        const df=dateStr===today?(fd?.items||[]):((await fbGet("food",dateStr))?.items||[]);
        const wEntry=wl.find(w=>w.date===dateStr);
        const daySessions=dateStr===today?allSessions.filter(s=>s.date===today):allSessions.filter(s=>s.date===dateStr);
        days.push({ date:dateStr, shortLabel:dayLabel(dateStr), kcal:Math.round(df.reduce((s,f)=>s+(Number(f.kcal)||0),0)), protein:Math.round(df.reduce((s,f)=>s+(Number(f.protein)||0),0)), weight:wEntry?wEntry.weight:null, sessions:daySessions.length });
      }
      setWeeklyData(days);
      setReady(true);
    })();
  },[]);

  async function changeDate(date) {
    setGlobalDate(date);
    const fd = await fbGet("food", date);
    const sl = await fbGet("supplements", date);
    setFoodLog(fd?.items||[]);
    setSuppLog(sl?.taken||[]);
  }

  async function addFood(item) {
    const updated = [...foodLog, item];
    setFoodLog(updated);
    await fbSet("food", globalDate, {items:updated, date:globalDate});
    if (globalDate===getToday()) setWeeklyData(prev=>prev.map(d=>d.date===globalDate?{...d,kcal:Math.round(updated.reduce((s,f)=>s+(Number(f.kcal)||0),0)),protein:Math.round(updated.reduce((s,f)=>s+(Number(f.protein)||0),0))}:d));
  }

  async function removeFood(id) {
    const updated = foodLog.filter(f=>f.id!==id);
    setFoodLog(updated);
    await fbSet("food", globalDate, {items:updated, date:globalDate});
  }

  async function toggleSupp(id) {
    const updated = suppLog.includes(id)?suppLog.filter(s=>s!==id):[...suppLog,id];
    setSuppLog(updated);
    await fbSet("supplements", globalDate, {taken:updated, date:globalDate});
  }

  async function addWeight(entry) {
    const updated = [...weightLog.filter(w=>w.date!==entry.date),entry].sort((a,b)=>a.date.localeCompare(b.date));
    setWeightLog(updated);
    await fbSet("stats","weight",{entries:updated});
    setWeeklyData(prev=>prev.map(d=>d.date===entry.date?{...d,weight:entry.weight}:d));
  }

  async function addPhoto(photo) { await fbSet("photos",photo.id,photo); setPhotos(prev=>[...prev,photo]); }
  async function deletePhoto(id) { await fbDel("photos",id); setPhotos(prev=>prev.filter(p=>p.id!==id)); }

  async function saveMyFood(food) { const updated=[...myFoods.filter(f=>f.name!==food.name),food]; setMyFoods(updated); await fbSet("data","myfoods",{items:updated}); }
  async function deleteMyFood(name) { const updated=myFoods.filter(f=>f.name!==name); setMyFoods(updated); await fbSet("data","myfoods",{items:updated}); }

  async function saveMeals(updated) { setMeals(updated); await fbSet("data","meals",{meals:updated}); }

  async function saveSession(session) { await fbSet("sessions",session.id,session); setSessions(prev=>[...prev,session].sort((a,b)=>a.date.localeCompare(b.date))); setWeeklyData(prev=>prev.map(d=>d.date===session.date?{...d,sessions:(d.sessions||0)+1}:d)); }
  async function deleteSession(id) { const s=sessions.find(s=>s.id===id); await fbDel("sessions",id); setSessions(prev=>prev.filter(s=>s.id!==id)); if(s) setWeeklyData(prev=>prev.map(d=>d.date===s.date?{...d,sessions:Math.max((d.sessions||0)-1,0)}:d)); }

  function exportData() {
    const data = { foodLog, suppLog, weightLog, myFoods, meals, sessions, exportedAt:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="fitness-hub-"+getToday()+".json"; a.click(); URL.revokeObjectURL(url);
  }

  async function saveBodyScan(scan) {
    const updated = [...bodyScanLog.filter(s=>s.date!==scan.date), scan].sort((a,b)=>a.date.localeCompare(b.date));
    setBodyScanLog(updated);
    await fbSet("data","bodyscans",{scans:updated});
    // Also update weight log from scan
    if (scan.weight) {
      const wUpdated = [...weightLog.filter(w=>w.date!==scan.date),{date:scan.date,weight:scan.weight}].sort((a,b)=>a.date.localeCompare(b.date));
      setWeightLog(wUpdated);
      await fbSet("stats","weight",{entries:wUpdated});
    }
  }

  async function logWater(glasses) {
    setWaterLog(glasses);
    await fbSet("water", getToday(), {glasses, date:getToday()});
  }

  const totals = foodLog.reduce((acc,f)=>({kcal:acc.kcal+(Number(f.kcal)||0),protein:acc.protein+(Number(f.protein)||0),carbs:acc.carbs+(Number(f.carbs)||0),fat:acc.fat+(Number(f.fat)||0)}),{kcal:0,protein:0,carbs:0,fat:0});

  if (!ready) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#1a1a2e" }}>
      <div style={{ fontSize:40, marginBottom:14 }}>🏋️</div>
      <div style={{ fontSize:14, color:"#fff", fontFamily:"Georgia,serif" }}>Loading your hub…</div>
    </div>
  );

  const TABS = [{id:"home",label:"Home",e:"🏠"},{id:"log",label:"Log",e:"📝"},{id:"train",label:"Train",e:"🏋️"},{id:"body",label:"Body",e:"⚖️"},{id:"supps",label:"Supps",e:"💊"}];

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f8f6f2", fontFamily:"Georgia,serif" }}>
      <div style={{ paddingBottom:74 }}>
        {tab==="home"  && <HomeTab  totals={totals} suppLog={suppLog} weightLog={weightLog} weeklyData={weeklyData} sessions={sessions} onExport={exportData} waterLog={waterLog} onLogWater={logWater}/>}
        {tab==="log"   && <LogTab   foodLog={foodLog} totals={totals} onAdd={addFood} onRemove={removeFood} myFoods={myFoods} onSaveFood={saveMyFood} onDeleteMyFood={deleteMyFood} meals={meals} onSaveMeals={saveMeals} globalDate={globalDate} onDateChange={changeDate}/>}
        {tab==="train" && <TrainTab sessions={sessions} onSaveSession={saveSession} onDeleteSession={deleteSession} weeklyData={weeklyData} globalDate={globalDate} onDateChange={changeDate}/>}
        {tab==="body"  && <BodyTab  weightLog={weightLog} onAdd={addWeight} photos={photos} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} bodyScanLog={bodyScanLog} onSaveScan={saveBodyScan}/>}
        {tab==="supps" && <SuppsTab suppLog={suppLog} onToggle={toggleSupp} globalDate={globalDate} onDateChange={changeDate}/>}
      </div>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", zIndex:999, borderTop:"1px solid #eee", display:"flex", boxShadow:"0 -4px 24px rgba(0,0,0,0.08)" }}>
        {TABS.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 0 12px", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, borderTop:`2.5px solid ${tab===t.id?"#e85d26":"transparent"}` }}>
            <span style={{ fontSize:22, lineHeight:1 }}>{t.e}</span>
            <span style={{ fontSize:9, fontWeight:700, fontFamily:"monospace", color:tab===t.id?"#e85d26":"#bbb" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
