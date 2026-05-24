import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

// ── Constants ────────────────────────────────────────────────────────────────

const TARGETS = { kcal: 1950, protein: 134, carbs: 230, fat: 55 };

const MEALS = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅", time: "7:00am", kcal: 362, protein: 50, carbs: 24, fat: 7,
    items: [
      { name: "Actimel Original 100ml",        kcal: 73,  protein: 3,    carbs: 11,  fat: 1.5 },
      { name: "ASDA Greek Yogurt 100g",         kcal: 66,  protein: 7,    carbs: 8,   fat: 0.5 },
      { name: "Soya Protein Crispies 30g",      kcal: 109, protein: 22.5, carbs: 2.3, fat: 0.7 },
      { name: "Blueberries x5",                kcal: 5,   protein: 0,    carbs: 1,   fat: 0   },
      { name: "Myprotein Whey Shake 25g",       kcal: 109, protein: 17,   carbs: 1.2, fat: 4   },
    ],
  },
  { id: "lunch", label: "Lunch", emoji: "☀️", time: "1:00pm", kcal: 541, protein: 41, carbs: 46, fat: 17,
    items: [
      { name: "Chickpeas 150g (cooked)",        kcal: 206, protein: 13,   carbs: 26,  fat: 4   },
      { name: "Edamame Beans 100g",             kcal: 155, protein: 12,   carbs: 6.5, fat: 7.6 },
      { name: "LM Vegan Sausages x2",           kcal: 130, protein: 13,   carbs: 5,   fat: 5   },
      { name: "Mixed Veg 150g",                 kcal: 50,  protein: 3,    carbs: 8,   fat: 0.5 },
    ],
  },
  { id: "dinner", label: "Dinner", emoji: "🌙", time: "6:00pm", kcal: 831, protein: 57, carbs: 72, fat: 47,
    items: [
      { name: "2 Rotlis (Aashirvaad atta)",     kcal: 170, protein: 5.5,  carbs: 36.5, fat: 0.7 },
      { name: "Apetina Paneer 100g",            kcal: 174, protein: 22,   carbs: 3.2,  fat: 8   },
      { name: "Mixed salad veg",                kcal: 15,  protein: 1,    carbs: 3,    fat: 0   },
      { name: "Green chutney + chilli sauce",   kcal: 45,  protein: 0.5,  carbs: 9,    fat: 0   },
      { name: "Nasto 30g",                      kcal: 143, protein: 2,    carbs: 17,   fat: 7   },
      { name: "KP Roasted Peanuts 30g",         kcal: 177, protein: 8.5,  carbs: 3.4,  fat: 13.8},
      { name: "Myprotein Whey Shake 25g",       kcal: 109, protein: 17,   carbs: 1.2,  fat: 4   },
    ],
  },
];

const FOOD_DB = [
  { name: "Banana (medium)",           kcal: 89,  protein: 1.1, carbs: 23,  fat: 0.3 },
  { name: "Apple (medium)",            kcal: 72,  protein: 0.4, carbs: 19,  fat: 0.2 },
  { name: "Orange (medium)",           kcal: 62,  protein: 1.2, carbs: 15,  fat: 0.2 },
  { name: "Mango 100g",                kcal: 60,  protein: 0.8, carbs: 15,  fat: 0.4 },
  { name: "Greek Yogurt 100g",         kcal: 66,  protein: 7,   carbs: 8,   fat: 0.5 },
  { name: "Whole Milk 200ml",          kcal: 130, protein: 6.8, carbs: 9.4, fat: 7.4 },
  { name: "Egg (large)",               kcal: 72,  protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: "Cheddar Cheese 30g",        kcal: 123, protein: 7.7, carbs: 0.1, fat: 10.2},
  { name: "Paneer 100g",               kcal: 174, protein: 22,  carbs: 3.2, fat: 8   },
  { name: "Tofu 100g",                 kcal: 76,  protein: 8,   carbs: 1.9, fat: 4.8 },
  { name: "Chickpeas 100g (cooked)",   kcal: 148, protein: 8,   carbs: 18,  fat: 3   },
  { name: "Lentils 100g (cooked)",     kcal: 116, protein: 9,   carbs: 20,  fat: 0.4 },
  { name: "Edamame 100g",              kcal: 155, protein: 12,  carbs: 6.5, fat: 7.6 },
  { name: "Oats 100g (dry)",           kcal: 389, protein: 17,  carbs: 66,  fat: 7   },
  { name: "Brown Rice 100g (cooked)",  kcal: 112, protein: 2.3, carbs: 24,  fat: 0.8 },
  { name: "White Rice 100g (cooked)",  kcal: 130, protein: 2.7, carbs: 28,  fat: 0.3 },
  { name: "Wholemeal Bread (slice)",   kcal: 78,  protein: 3.5, carbs: 14,  fat: 1   },
  { name: "Pasta 100g (cooked)",       kcal: 131, protein: 5,   carbs: 25,  fat: 1.1 },
  { name: "Rotli (1 medium)",          kcal: 85,  protein: 2.8, carbs: 17,  fat: 0.7 },
  { name: "Chapati (1 medium)",        kcal: 80,  protein: 2.5, carbs: 15,  fat: 1   },
  { name: "Naan (1 medium)",           kcal: 262, protein: 8.7, carbs: 45,  fat: 5.1 },
  { name: "Peanut Butter 1 tbsp",      kcal: 94,  protein: 4,   carbs: 3.1, fat: 8   },
  { name: "Almonds 30g",               kcal: 173, protein: 6.3, carbs: 6,   fat: 15  },
  { name: "Avocado (half)",            kcal: 120, protein: 1.5, carbs: 6.4, fat: 11  },
  { name: "Sweet Potato 100g",         kcal: 86,  protein: 1.6, carbs: 20,  fat: 0.1 },
  { name: "Broccoli 100g",             kcal: 34,  protein: 2.8, carbs: 7,   fat: 0.4 },
  { name: "Spinach 100g",              kcal: 23,  protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Salmon 100g",               kcal: 208, protein: 20,  carbs: 0,   fat: 13  },
  { name: "Tuna (canned 100g)",        kcal: 116, protein: 26,  carbs: 0,   fat: 1   },
  { name: "Dal 100g (cooked)",         kcal: 116, protein: 9,   carbs: 20,  fat: 0.4 },
  { name: "Dal Makhani 100g",          kcal: 130, protein: 6,   carbs: 15,  fat: 5   },
  { name: "Biryani 200g",              kcal: 320, protein: 18,  carbs: 42,  fat: 8   },
  { name: "Samosa (1)",                kcal: 150, protein: 3,   carbs: 18,  fat: 8   },
  { name: "Idli (1)",                  kcal: 39,  protein: 2,   carbs: 8,   fat: 0.2 },
  { name: "Dosa (plain)",              kcal: 168, protein: 4,   carbs: 32,  fat: 2   },
  { name: "Pizza slice (margherita)",  kcal: 250, protein: 10,  carbs: 32,  fat: 9   },
  { name: "Fish and Chips (portion)",  kcal: 840, protein: 28,  carbs: 98,  fat: 38  },
  { name: "Whey Protein 25g",          kcal: 109, protein: 17,  carbs: 1.2, fat: 4   },
  { name: "Protein Bar (avg)",         kcal: 200, protein: 20,  carbs: 22,  fat: 7   },
  { name: "KP Peanuts 30g",            kcal: 177, protein: 8.5, carbs: 3.4, fat: 13.8},
  { name: "Nasto mix 30g",             kcal: 143, protein: 2,   carbs: 17,  fat: 7   },
  { name: "Actimel 100ml",             kcal: 73,  protein: 3,   carbs: 11,  fat: 1.5 },
  { name: "Soya Crispies 30g",         kcal: 109, protein: 22.5,carbs: 2.3, fat: 0.7 },
  { name: "Chocolate (dark 30g)",      kcal: 171, protein: 2.2, carbs: 16,  fat: 12  },
  { name: "Crisps (small bag 25g)",    kcal: 130, protein: 1.7, carbs: 13,  fat: 8.3 },
  { name: "Coffee (black)",            kcal: 2,   protein: 0.3, carbs: 0,   fat: 0   },
  { name: "Orange Juice 200ml",        kcal: 84,  protein: 1.2, carbs: 20,  fat: 0.2 },
];

const TRAINING_TYPES = [
  { id: "cardio",  label: "Cardio",   emoji: "🏃", kcalPerMin: 8  },
  { id: "weights", label: "Weights",  emoji: "💪", kcalPerMin: 5  },
  { id: "hiit",    label: "HIIT",     emoji: "⚡", kcalPerMin: 10 },
  { id: "cycling", label: "Cycling",  emoji: "🚴", kcalPerMin: 8  },
  { id: "yoga",    label: "Yoga",     emoji: "🧘", kcalPerMin: 3  },
  { id: "walk",    label: "Walking",  emoji: "🚶", kcalPerMin: 4  },
  { id: "swim",    label: "Swimming", emoji: "🏊", kcalPerMin: 9  },
  { id: "other",   label: "Other",    emoji: "🏋️", kcalPerMin: 5  },
];

const SUPPLEMENTS = [
  { id: "vitd",  label: "Vitamin D",          time: "Morning",     emoji: "☀️", color: "#f59e0b" },
  { id: "iq",    label: "IQ Supplement",       time: "Morning",     emoji: "🧠", color: "#3b82f6" },
  { id: "ashwa", label: "Ashwagandha KSM-66",  time: "With Dinner", emoji: "🌿", color: "#22c55e" },
  { id: "mag",   label: "Magnesium Glycinate", time: "Before Bed",  emoji: "😴", color: "#a855f7" },
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const getToday = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"}); } catch { return d; } };
const dayLabel = (d) => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short"}); } catch { return d; } };

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
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch (err) { reject(err); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Firebase helpers
const userDoc = (uid, col, id) => doc(db, "users", uid, col, id);

const fbGet = async (uid, col, id) => {
  try {
    const snap = await getDoc(userDoc(uid, col, id));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

const fbSet = async (uid, col, id, data) => {
  try { await setDoc(userDoc(uid, col, id), data); } catch (e) { console.error("Save failed:", e); }
};

const fbDel = async (uid, col, id) => {
  try { await deleteDoc(userDoc(uid, col, id)); } catch {}
};

const fbGetAll = async (uid, col) => {
  try {
    const snap = await getDocs(collection(db, "users", uid, col));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

// ── Shared UI ────────────────────────────────────────────────────────────────

function Ring({ value, max, color, size, stroke, children }) {
  const s = size || 90; const st = stroke || 9;
  const r = (s - st) / 2; const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position:"relative", width:s, height:s, flexShrink:0 }}>
      <svg width={s} height={s} style={{ transform:"rotate(-90deg)" }}>
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

// ── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError("Sign in failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🏋️</div>
      <div style={{ fontSize:28, fontWeight:900, color:"#fff", marginBottom:8, textAlign:"center" }}>My Fitness Hub</div>
      <div style={{ fontSize:14, color:"#8899bb", marginBottom:48, textAlign:"center", lineHeight:1.6 }}>Your personal fitness tracker.</div>

      <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:18, padding:24, width:"100%", maxWidth:320, marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:12 }}>What's saved to your account:</div>
        {["📝 Daily food & calorie logs","🏋️ Training sessions","⚖️ Weight history & graphs","📸 Progress photos","💊 Supplement tracker"].map((f,i)=>(
          <div key={i} style={{ fontSize:12, color:"#8899bb", marginBottom:8 }}>{f}</div>
        ))}
      </div>

      {error && <div style={{ fontSize:12, color:"#ef4444", marginBottom:16 }}>{error}</div>}

      <button type="button" onClick={handleLogin} disabled={loading} style={{ width:"100%", maxWidth:320, padding:"16px", background:loading?"#aaa":"#fff", color:"#1a1a2e", border:"none", borderRadius:14, fontSize:16, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>G</span>
        {loading ? "Signing in…" : "Sign in with Google"}
      </button>

      <div style={{ fontSize:11, color:"#8899bb", marginTop:20, textAlign:"center", lineHeight:1.6, maxWidth:280 }}>
        Your data is saved to your Google account and syncs across all your devices.
      </div>
    </div>
  );
}

// ── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ totals, suppLog, weightLog, weeklyData, onExport }) {
  const hr = new Date().getHours();
  const greeting = hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const dateStr = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const latest = weightLog.length>0 ? weightLog[weightLog.length-1].weight : null;
  const change = latest ? (latest-67).toFixed(1) : null;
  const remaining = Math.max(Math.round(TARGETS.kcal-totals.kcal),0);
  const weekAvgKcal = weeklyData.filter(d=>d.kcal>0).length>0 ? Math.round(weeklyData.reduce((s,d)=>s+d.kcal,0)/weeklyData.filter(d=>d.kcal>0).length) : 0;
  const weekTrainCount = weeklyData.reduce((s,d)=>s+d.sessions,0);

  return (
    <div>
      <div style={{ background:"linear-gradient(160deg,#1a1a2e 0%,#0f3460 100%)", padding:"48px 20px 24px", color:"#fff" }}>
        <div style={{ fontSize:10, color:"#e85d26", fontFamily:"monospace", letterSpacing:3, marginBottom:8 }}>MY FITNESS HUB</div>
        <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>{greeting} 👋</div>
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
            {change && <div style={{ fontSize:9, color:parseFloat(change)<=0?"#22c55e":"#e85d26" }}>{parseFloat(change)<=0?"↓":"↑"}{Math.abs(change)}kg</div>}
          </Card>
          <Card s