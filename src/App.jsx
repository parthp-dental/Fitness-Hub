import React, { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { db, UID } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

// ── Accent colours ────────────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { id:"orange", label:"Orange", value:"#ff6b35" },
  { id:"lime",   label:"Lime",   value:"#c8f65a" },
  { id:"blue",   label:"Blue",   value:"#4facfe" },
  { id:"purple", label:"Purple", value:"#a78bfa" },
  { id:"teal",   label:"Teal",   value:"#2dd4bf" },
];
function getAccent(id) { return ACCENT_COLORS.find(a=>a.id===id)?.value || "#ff6b35"; }

// ── Design tokens ─────────────────────────────────────────────────────────────
function tokens(accent) {
  return {
    bg:"#0a0a0a", surface:"#141414", surfaceAlt:"#1e1e1e", surfaceHigh:"#252525",
    border:"#2a2a2a", borderLight:"#333",
    text:"#ffffff", textSub:"#999999", textMuted:"#555555",
    accent, accentDim:accent+"22", accentMid:accent+"44",
    danger:"#ff4d4d", success:"#22c55e", warning:"#f59e0b",
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TARGETS = { kcal:1950, protein:134, carbs:230, fat:55 };

const DEFAULT_MEALS = [
  { id:"breakfast", label:"Breakfast", emoji:"🌅", time:"7:00am", items:[
    { name:"Actimel Original 100ml",    kcal:73,  protein:3,    carbs:11,  fat:1.5, defaultQty:100, unit:"ml" },
    { name:"ASDA Greek Yogurt 100g",    kcal:66,  protein:7,    carbs:8,   fat:0.5, defaultQty:100, unit:"g"  },
    { name:"Soya Protein Crispies 30g", kcal:109, protein:22.5, carbs:2.3, fat:0.7, defaultQty:30,  unit:"g"  },
    { name:"Blueberries x5",            kcal:5,   protein:0,    carbs:1,   fat:0,   defaultQty:5,   unit:"x"  },
    { name:"Myprotein Whey Shake 25g",  kcal:109, protein:17,   carbs:1.2, fat:4,   defaultQty:25,  unit:"g"  },
  ]},
  { id:"lunch", label:"Lunch", emoji:"☀️", time:"1:00pm", items:[
    { name:"Chickpeas 150g (cooked)", kcal:206, protein:13, carbs:26,  fat:4,   defaultQty:150, unit:"g" },
    { name:"Edamame Beans 100g",      kcal:155, protein:12, carbs:6.5, fat:7.6, defaultQty:100, unit:"g" },
    { name:"LM Vegan Sausages x2",    kcal:130, protein:13, carbs:5,   fat:5,   defaultQty:2,   unit:"x" },
    { name:"Mixed Veg 150g",          kcal:50,  protein:3,  carbs:8,   fat:0.5, defaultQty:150, unit:"g" },
  ]},
  { id:"dinner", label:"Dinner", emoji:"🌙", time:"6:00pm", items:[
    { name:"2 Rotlis (Aashirvaad atta)",    kcal:170, protein:5.5, carbs:36.5, fat:0.7,  defaultQty:2,   unit:"x" },
    { name:"Apetina Paneer 100g",           kcal:174, protein:22,  carbs:3.2,  fat:8,    defaultQty:100, unit:"g" },
    { name:"Mixed salad veg",               kcal:15,  protein:1,   carbs:3,    fat:0,    defaultQty:80,  unit:"g" },
    { name:"Green chutney + chilli sauce",  kcal:45,  protein:0.5, carbs:9,    fat:0,    defaultQty:30,  unit:"g" },
    { name:"Nasto 30g",                     kcal:143, protein:2,   carbs:17,   fat:7,    defaultQty:30,  unit:"g" },
    { name:"KP Roasted Peanuts 30g",        kcal:177, protein:8.5, carbs:3.4,  fat:13.8, defaultQty:30,  unit:"g" },
    { name:"Myprotein Whey Shake 25g",      kcal:109, protein:17,  carbs:1.2,  fat:4,    defaultQty:25,  unit:"g" },
  ]},
];

const FOOD_DB = [
  { name:"Banana (medium)",          kcal:89,  protein:1.1, carbs:23,  fat:0.3 },
  { name:"Apple (medium)",           kcal:72,  protein:0.4, carbs:19,  fat:0.2 },
  { name:"Orange (medium)",          kcal:62,  protein:1.2, carbs:15,  fat:0.2 },
  { name:"Mango 100g",               kcal:60,  protein:0.8, carbs:15,  fat:0.4 },
  { name:"Greek Yogurt 100g",        kcal:66,  protein:7,   carbs:8,   fat:0.5 },
  { name:"Arla Skyr Vanilla 100g",   kcal:73,  protein:8.6, carbs:8.6, fat:0.2 },
  { name:"Whole Milk 200ml",         kcal:130, protein:6.8, carbs:9.4, fat:7.4 },
  { name:"Paneer 100g (Apetina)",    kcal:174, protein:22,  carbs:3.2, fat:8   },
  { name:"Paneer 100g (Everest)",    kcal:347, protein:20.9,carbs:4.1, fat:27.7},
  { name:"Tofu 100g",                kcal:76,  protein:8,   carbs:1.9, fat:4.8 },
  { name:"Chickpeas 100g (cooked)",  kcal:148, protein:8,   carbs:18,  fat:3   },
  { name:"Lentils 100g (cooked)",    kcal:116, protein:9,   carbs:20,  fat:0.4 },
  { name:"Edamame 100g",             kcal:155, protein:12,  carbs:6.5, fat:7.6 },
  { name:"Oats 100g (dry)",          kcal:389, protein:17,  carbs:66,  fat:7   },
  { name:"Brown Rice 100g (cooked)", kcal:112, protein:2.3, carbs:24,  fat:0.8 },
  { name:"White Rice 100g (cooked)", kcal:130, protein:2.7, carbs:28,  fat:0.3 },
  { name:"Wholemeal Bread (slice)",  kcal:78,  protein:3.5, carbs:14,  fat:1   },
  { name:"Rotli (1 medium)",         kcal:85,  protein:2.8, carbs:17,  fat:0.7 },
  { name:"Chapati (1 medium)",       kcal:80,  protein:2.5, carbs:15,  fat:1   },
  { name:"Naan (1 medium)",          kcal:262, protein:8.7, carbs:45,  fat:5.1 },
  { name:"Peanut Butter 1 tbsp",     kcal:94,  protein:4,   carbs:3.1, fat:8   },
  { name:"Almonds 30g",              kcal:173, protein:6.3, carbs:6,   fat:15  },
  { name:"Almonds 5 nuts",           kcal:35,  protein:1.3, carbs:1.2, fat:3   },
  { name:"Sweet Potato 100g",        kcal:86,  protein:1.6, carbs:20,  fat:0.1 },
  { name:"Broccoli 100g",            kcal:34,  protein:2.8, carbs:7,   fat:0.4 },
  { name:"Spinach 100g",             kcal:23,  protein:2.9, carbs:3.6, fat:0.4 },
  { name:"Dal 100g (cooked)",        kcal:116, protein:9,   carbs:20,  fat:0.4 },
  { name:"Biryani 200g",             kcal:320, protein:18,  carbs:42,  fat:8   },
  { name:"Samosa (1)",               kcal:150, protein:3,   carbs:18,  fat:8   },
  { name:"Gathiya 20g",              kcal:100, protein:2.8, carbs:10,  fat:5.6 },
  { name:"Crispy Bhindi 30g",        kcal:40,  protein:1.2, carbs:4.2, fat:1.5 },
  { name:"Pizza slice",              kcal:250, protein:10,  carbs:32,  fat:9   },
  { name:"Whey Protein 25g",         kcal:109, protein:17,  carbs:1.2, fat:4   },
  { name:"Protein Bar (avg)",        kcal:200, protein:20,  carbs:22,  fat:7   },
  { name:"KP Peanuts 30g",           kcal:177, protein:8.5, carbs:3.4, fat:13.8},
  { name:"Nasto mix 30g",            kcal:143, protein:2,   carbs:17,  fat:7   },
  { name:"Actimel 100ml",            kcal:73,  protein:3,   carbs:11,  fat:1.5 },
  { name:"Soya Crispies 30g",        kcal:109, protein:22.5,carbs:2.3, fat:0.7 },
  { name:"Coffee (black)",           kcal:2,   protein:0.3, carbs:0,   fat:0   },
  { name:"Orange Juice 200ml",       kcal:84,  protein:1.2, carbs:20,  fat:0.2 },
  { name:"Creatine 3g",              kcal:0,   protein:0,   carbs:0,   fat:0   },
];

const SUPPLEMENTS = [
  { id:"vitd",  label:"Vitamin D",          time:"Morning",     emoji:"☀️", color:"#f59e0b" },
  { id:"iq",    label:"IQ Supplement",       time:"Morning",     emoji:"🧠", color:"#4facfe" },
  { id:"ashwa", label:"Ashwagandha KSM-66",  time:"With Dinner", emoji:"🌿", color:"#22c55e" },
  { id:"mag",   label:"Magnesium Glycinate", time:"Before Bed",  emoji:"😴", color:"#a78bfa" },
];

const GYM_EXERCISES = {
  "Chest":     ["Bench Press","Incline Bench Press","Decline Bench Press","Chest Flyes","Cable Crossover","Dips"],
  "Back":      ["Deadlift","Barbell Row","Lat Pulldown","Cable Row","T-Bar Row","Seated Row"],
  "Shoulders": ["Overhead Press","Lateral Raises","Front Raises","Rear Delt Flyes","Arnold Press","Shrugs"],
  "Arms":      ["Bicep Curl","Hammer Curl","Tricep Pushdown","Skull Crushers","Preacher Curl","Tricep Dips"],
  "Legs":      ["Squat","Leg Press","Romanian Deadlift","Leg Curl","Leg Extension","Calf Raises","Lunges"],
  "Core":      ["Plank","Cable Crunches","Leg Raises","Russian Twist","Ab Wheel"],
};
const BW_EXERCISES = {
  "Push": ["Push Ups","Wide Push Ups","Diamond Push Ups","Pike Push Ups","Dips"],
  "Pull": ["Pull Ups","Chin Ups","Inverted Rows"],
  "Legs": ["Squats","Lunges","Jump Squats","Glute Bridges","Calf Raises"],
  "Core": ["Plank","Crunches","Leg Raises","Mountain Climbers","Burpees"],
};
const CARDIO_TYPES = ["Incline Walk","Treadmill","Cross Trainer","Cycling","Rowing","Running (outdoor)","HIIT","Swimming"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToday = () => new Date().toISOString().split("T")[0];
const fmtDate = d => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"}); } catch { return d; } };
const fmtDateLong = d => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); } catch { return d; } };
const dayLabel = d => { try { return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short"}); } catch { return d; } };
const mealTotal = meal => meal.items.reduce((a,i)=>({kcal:a.kcal+i.kcal,protein:a.protein+i.protein,carbs:a.carbs+i.carbs,fat:a.fat+i.fat}),{kcal:0,protein:0,carbs:0,fat:0});

const compress = file => new Promise((resolve,reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Read failed"));
  reader.onload = e => {
    const img = new Image();
    img.onerror = () => reject(new Error("Image failed"));
    img.onload = () => {
      try {
        const maxW=480, scale=Math.min(1,maxW/img.width);
        const canvas=document.createElement("canvas");
        canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",0.6));
      } catch(err) { reject(err); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const userDoc = (col,id) => doc(db,"users",UID,col,id);
const fbGet = async (col,id) => { try { const snap=await getDoc(userDoc(col,id)); return snap.exists()?snap.data():null; } catch { return null; } };
const fbSet = async (col,id,data) => { try { await setDoc(userDoc(col,id),data); } catch(e) { console.error(e); } };
const fbDel = async (col,id) => { try { await deleteDoc(userDoc(col,id)); } catch {} };
const fbGetAll = async col => { try { const snap=await getDocs(collection(db,"users",UID,col)); return snap.docs.map(d=>({id:d.id,...d.data()})); } catch { return []; } };

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Ring({ value, max, color, size=90, stroke=7, children }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, pct=Math.min(value/max,1);
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a2a" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.6s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{children}</div>
    </div>
  );
}

function Lbl({ children, color, style }) {
  return <div style={{fontSize:10,color:color||"#ff6b35",fontFamily:"monospace",letterSpacing:3,fontWeight:600,...(style||{})}}>{children}</div>;
}

function MiniBar({ value, max, color, height=3 }) {
  return (
    <div style={{height,background:"#2a2a2a",borderRadius:99}}>
      <div style={{height:"100%",width:`${Math.min(value/max*100,100)}%`,background:color,borderRadius:99,transition:"width 0.5s ease"}}/>
    </div>
  );
}

function MacroRow({ label, value, target, color }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:12,color:"#999"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color}}>{Math.round(value)}g <span style={{color:"#444",fontWeight:400}}>/ {target}g</span></span>
      </div>
      <MiniBar value={value} max={target} color={color}/>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",background:"#1e1e1e",color:"#fff",padding:"12px 20px",borderRadius:99,fontSize:13,fontWeight:600,zIndex:99999,border:"1px solid #333",whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>{msg}</div>;
}

function DateNav({ date, onChange, T }) {
  const isToday = date===getToday();
  const back = () => { const d=new Date(date+"T00:00:00"); d.setDate(d.getDate()-1); onChange(d.toISOString().split("T")[0]); };
  const fwd  = () => { const d=new Date(date+"T00:00:00"); d.setDate(d.getDate()+1); const n=d.toISOString().split("T")[0]; if(n<=getToday()) onChange(n); };
  return (
    <div>
      <div style={{background:T.surface,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.border}`}}>
        <button type="button" onClick={back} style={{width:40,height:40,borderRadius:12,border:`1px solid ${T.border}`,background:T.surfaceAlt,cursor:"pointer",fontSize:18,color:T.text,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <input type="date" value={date} max={getToday()} onChange={e=>e.target.value&&onChange(e.target.value)}
          style={{flex:1,padding:"9px 12px",borderRadius:12,border:`1px solid ${isToday?T.accent:T.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,textAlign:"center",fontWeight:700,color:isToday?T.accent:T.text,colorScheme:"dark"}}/>
        <button type="button" onClick={fwd} disabled={isToday} style={{width:40,height:40,borderRadius:12,border:`1px solid ${T.border}`,background:T.surfaceAlt,cursor:isToday?"not-allowed":"pointer",fontSize:18,color:isToday?T.textMuted:T.text,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        {!isToday&&<button type="button" onClick={()=>onChange(getToday())} style={{padding:"6px 14px",borderRadius:10,background:T.accent,color:"#000",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Today</button>}
      </div>
      {!isToday&&<div style={{background:T.surfaceAlt,padding:"7px 16px",fontSize:11,color:T.accent,fontWeight:600,textAlign:"center",borderBottom:`1px solid ${T.border}`}}>Editing: {fmtDateLong(date)}</div>}
    </div>
  );
}

function SubTabs({ tabs, active, onChange, T }) {
  return (
    <div style={{display:"flex",background:T.surface,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
      {tabs.map(([key,label])=>(
        <button key={key} type="button" onClick={()=>onChange(key)} style={{flexShrink:0,padding:"13px 14px",border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"monospace",color:active===key?T.accent:T.textMuted,borderBottom:`2px solid ${active===key?T.accent:"transparent"}`,letterSpacing:0.5}}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Nutrition Label Scanner ───────────────────────────────────────────────────
function NutritionScanModal({ onConfirm, onClose, T }) {
  const [scanning,setScanning]=useState(false), [result,setResult]=useState(null), [error,setError]=useState(""), [tReady,setTReady]=useState(!!window.Tesseract), [foodName,setFoodName]=useState(""), [editedMacros,setEditedMacros]=useState(null);
  useEffect(()=>{ if(window.Tesseract){setTReady(true);return;} const s=document.createElement("script"); s.src="https://unpkg.com/tesseract.js@5/dist/tesseract.min.js"; s.onload=()=>setTReady(true); document.head.appendChild(s); },[]);
  function extractMacros(text) {
    let t=text.toLowerCase(); t=t.replace(/(\d+)[,](?=\d)/g,"$1."); const r={};
    const km=t.match(/(\d+)\s*kcal/); if(km) r.kcal=parseFloat(km[1]); else { const cm=t.match(/calorie[s]?\D{0,5}(\d+)/); if(cm) r.kcal=parseFloat(cm[1]); }
    const pm=t.match(/protein[^\d]*(\d+\.?\d*)/); if(pm) r.protein=parseFloat(pm[1]);
    const lines=t.split("\n");
    for(const l of lines){ if(/carbohydrat|total carb/.test(l)&&!/of which|which/.test(l)){const m=l.match(/(\d+\.?\d*)/);if(m){r.carbs=parseFloat(m[1]);break;}} }
    for(const l of lines){ if(/\bfat\b/.test(l)&&!/saturate|trans/.test(l)){const nums=[...l.matchAll(/(\d+\.?\d*)/g)].map(m=>parseFloat(m[1]));const v=nums.find(n=>n>0&&n<100);if(v!==undefined){r.fat=v;break;}} }
    return r;
  }
  async function handleUpload(e) {
    const file=e.target.files[0]; if(!file) return; e.target.value="";
    if(!tReady||!window.Tesseract){setError("Scanner loading, try again.");return;}
    setScanning(true); setResult(null); setError("");
    try {
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file);});
      const canvas=document.createElement("canvas"); const scale=Math.min(3,2400/Math.max(img.width,img.height));
      canvas.width=img.width*scale; canvas.height=img.height*scale;
      const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const id=ctx.getImageData(0,0,canvas.width,canvas.height); const d=id.data;
      for(let i=0;i<d.length;i+=4){const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];const v=g<128?Math.max(0,g-30):Math.min(255,g+30);d[i]=d[i+1]=d[i+2]=v;}
      ctx.putImageData(id,0,0);
      const ocr=await window.Tesseract.recognize(canvas,"eng",{tessedit_pageseg_mode:"6"});
      const macros=extractMacros(ocr.data.text);
      if(!macros.kcal&&!macros.protein) throw new Error("Could not find nutrition info.");
      setResult(macros); setEditedMacros({...macros});
    } catch(err){setError(err.message||"Could not read label.");}
    setScanning(false);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:99998,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 20px 40px",maxHeight:"90vh",overflowY:"auto",border:`1px solid ${T.border}`}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:99,margin:"0 auto 18px"}}/>
        <div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>📸 Scan Nutrition Label</div>
        <div style={{fontSize:12,color:T.textSub,marginBottom:20,lineHeight:1.6}}>Works with supermarket labels, app screenshots, websites.</div>
        {!result&&(
          <div>
            {!tReady&&<div style={{fontSize:12,color:T.warning,background:T.surfaceAlt,borderRadius:10,padding:"10px 14px",marginBottom:12}}>⏳ Loading scanner...</div>}
            <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:10}}>
              <div style={{padding:"18px",background:scanning||!tReady?"#333":T.accent,color:scanning||!tReady?"#666":"#000",textAlign:"center",fontSize:14,fontWeight:700,borderRadius:14,pointerEvents:"none"}}>
                {scanning?"🔍 Reading label...":"📷 Upload Label Photo"}
              </div>
              <input type="file" accept="image/*" onChange={handleUpload} disabled={scanning||!tReady} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}}/>
            </div>
            {error&&<div style={{fontSize:12,color:T.danger,background:"#ff4d4d15",borderRadius:10,padding:"10px 14px",border:`1px solid #ff4d4d30`}}>{error}</div>}
          </div>
        )}
        {result&&editedMacros&&(
          <div>
            <div style={{fontSize:12,color:T.success,fontWeight:600,marginBottom:14}}>✅ Label read — check and correct if needed</div>
            <input value={foodName} onChange={e=>setFoodName(e.target.value)} placeholder="Food name *"
              style={{width:"100%",padding:"13px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:14,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,marginBottom:12,boxSizing:"border-box"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["Calories","kcal",T.accent],["Protein (g)","protein","#22c55e"],["Carbs (g)","carbs","#4facfe"],["Fat (g)","fat","#f59e0b"]].map(([l,k,c])=>(
                <div key={k}>
                  <div style={{fontSize:10,color:c,fontFamily:"monospace",fontWeight:700,marginBottom:5,letterSpacing:1}}>{l.toUpperCase()}</div>
                  <input type="number" step="0.1" value={editedMacros[k]||""} onChange={e=>setEditedMacros(p=>({...p,[k]:parseFloat(e.target.value)||0}))} placeholder="0"
                    style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:18,fontWeight:700,textAlign:"center",fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <button type="button" disabled={!foodName.trim()} onClick={()=>onConfirm({name:foodName.trim(),kcal:editedMacros.kcal||0,protein:editedMacros.protein||0,carbs:editedMacros.carbs||0,fat:editedMacros.fat||0})}
              style={{width:"100%",padding:"15px",background:foodName.trim()?T.accent:"#333",color:foodName.trim()?"#000":"#666",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:foodName.trim()?"pointer":"not-allowed",marginBottom:10}}>
              ⭐ Save to My Foods
            </button>
            <button type="button" onClick={()=>{setResult(null);setEditedMacros(null);setFoodName("");}}
              style={{width:"100%",padding:"12px",background:T.surfaceAlt,color:T.textSub,border:`1px solid ${T.border}`,borderRadius:14,fontSize:13,cursor:"pointer"}}>
              📷 Scan another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quantity Modal ────────────────────────────────────────────────────────────
function QuantityModal({ item, onConfirm, onClose, T }) {
  const [qty,setQty]=useState(item.defaultQty||100);
  const base=item.defaultQty||100, unit=item.unit||"g", ratio=Number(qty)/base;
  const scaled={kcal:Math.round((item.kcal||0)*ratio),protein:Math.round((item.protein||0)*ratio*10)/10,carbs:Math.round((item.carbs||0)*ratio*10)/10,fat:Math.round((item.fat||0)*ratio*10)/10};
  const presets=unit==="x"?[1,2,3,4,5]:unit==="ml"?[50,100,150,200,250]:[25,50,75,100,125,150,200];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:99998,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 20px 44px",border:`1px solid ${T.border}`}}>
        <div style={{width:36,height:4,background:T.border,borderRadius:99,margin:"0 auto 18px"}}/>
        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{item.name}</div>
        <div style={{fontSize:12,color:T.textSub,marginBottom:20}}>Default: {base}{unit} · Adjust below</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <button type="button" onClick={()=>setQty(q=>Math.max(unit==="x"?1:5,Number(q)-(unit==="x"?1:unit==="ml"?50:10)))}
            style={{width:52,height:52,borderRadius:14,background:T.surfaceAlt,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:22,fontWeight:700,color:T.text}}>−</button>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}>
            <input type="number" value={qty} onChange={e=>setQty(e.target.value)} min="1"
              style={{flex:1,padding:"14px",borderRadius:14,border:`2px solid ${T.accent}`,fontSize:24,fontWeight:800,textAlign:"center",fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text}}/>
            <span style={{fontSize:16,color:T.textSub,fontWeight:600}}>{unit}</span>
          </div>
          <button type="button" onClick={()=>setQty(q=>Number(q)+(unit==="x"?1:unit==="ml"?50:10))}
            style={{width:52,height:52,borderRadius:14,background:T.surfaceAlt,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:22,fontWeight:700,color:T.text}}>+</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {presets.map(v=>(
            <button key={v} type="button" onClick={()=>setQty(v)} style={{padding:"8px 16px",borderRadius:99,border:`1px solid ${Number(qty)===v?T.accent:T.border}`,background:Number(qty)===v?T.accentDim:T.surfaceAlt,color:Number(qty)===v?T.accent:T.textSub,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {v}{unit}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
          {[["Kcal",scaled.kcal,T.accent],["Protein",scaled.protein+"g","#22c55e"],["Carbs",scaled.carbs+"g","#4facfe"],["Fat",scaled.fat+"g","#f59e0b"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",background:T.surfaceAlt,borderRadius:12,padding:"10px 4px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:9,color:T.textMuted,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <button type="button" onClick={()=>onConfirm({...item,name:`${item.name} (${qty}${unit})`,...scaled})}
          style={{width:"100%",padding:"16px",background:T.accent,color:"#000",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>
          + Add {qty}{unit} to Log
        </button>
      </div>
    </div>
  );
}

// ── Weekly Analysis Card ──────────────────────────────────────────────────────
function WeeklyAnalysisCard({ sessions, weeklyData, T }) {
  const [copied,setCopied]=useState(false);
  function buildReport() {
    const ws=sessions.filter(s=>{const d=new Date(s.date+"T00:00:00");const w=new Date();w.setDate(w.getDate()-7);return d>=w;});
    const active=weeklyData.filter(d=>d.kcal>0);
    const avgK=active.length?Math.round(active.reduce((s,d)=>s+d.kcal,0)/active.length):0;
    const avgP=active.length?Math.round(active.reduce((s,d)=>s+d.protein,0)/active.length):0;
    const weights=weeklyData.filter(d=>d.weight).map(d=>d.weight);
    const wChange=weights.length>=2?(weights[weights.length-1]-weights[0]).toFixed(1):null;
    let r="=== WEEKLY FITNESS REPORT ===\nWeek ending: "+new Date().toLocaleDateString("en-GB")+"\n\n";
    r+="ABOUT ME:\nAge 28, 168cm, UK dentist. Goal: body recomposition 22.7%→12-14% BF. Vegetarian, no eggs.\nTarget: 1950 kcal | 134g protein\n\n--- NUTRITION ---\n";
    r+="Avg kcal: "+avgK+" (target 1950)\nAvg protein: "+avgP+"g (target 134g)\nDays tracked: "+active.length+"/7\n";
    weeklyData.forEach(d=>{r+="  "+d.shortLabel+": "+d.kcal+" kcal, "+d.protein+"g protein\n";});
    r+="\n--- BODY ---\n";
    if(weights.length){r+="Latest: "+weights[weights.length-1]+"kg\n";if(wChange)r+="Change: "+wChange+"kg\n";}else r+="No weight logged\n";
    r+="\n--- TRAINING ("+ws.length+" sessions) ---\n";
    if(!ws.length)r+="No sessions logged\n";
    else ws.forEach(s=>{
      r+="\n"+fmtDate(s.date)+" - "+s.sessionName+" ("+s.mode+")\n";
      if(s.mode==="cardio")r+="  "+s.cardioData?.type+": "+s.cardioData?.duration+"mins"+(s.cardioData?.distance?", "+s.cardioData.distance+"km":"")+"\n";
      else s.exercises?.forEach(ex=>{r+="  "+ex.name+":\n";ex.sets.forEach((set,i)=>{r+="    Set "+(i+1)+": "+set.reps+" reps"+(set.weight?" @ "+set.weight+"kg":"")+"\n";});});
    });
    r+="\n=== END ===\nAnalyse: 1.Body recomp 2.Strength progress 3.Nutrition consistency 4.Next week recommendations";
    return r;
  }
  function copy(){navigator.clipboard.writeText(buildReport()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000);}).catch(()=>{});}
  const active=weeklyData.filter(d=>d.kcal>0);
  const avgK=active.length?Math.round(active.reduce((s,d)=>s+d.kcal,0)/active.length):0;
  const weekSessions=sessions.filter(s=>{const d=new Date(s.date+"T00:00:00");const w=new Date();w.setDate(w.getDate()-7);return d>=w;}).length;
  return (
    <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><Lbl color={T.accent} style={{marginBottom:6}}>WEEKLY ANALYSIS</Lbl><div style={{fontSize:15,fontWeight:700,color:T.text}}>Copy → paste to Claude</div></div>
        <button type="button" onClick={copy} style={{padding:"10px 16px",background:copied?T.success:T.accent,color:"#000",border:"none",borderRadius:12,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
          {copied?"✅ Copied":"📋 Copy"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["Sessions",weekSessions+" this wk",T.accent],["Avg Kcal",avgK?avgK+" kcal":"—",T.text],["Tracked",active.length+"/7 days",T.textSub]].map(([l,v,c])=>(
          <div key={l} style={{background:T.surfaceAlt,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:9,color:T.textMuted,marginTop:2,fontFamily:"monospace"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({ totals, suppLog, weightLog, weeklyData, sessions, onExport, waterLog, onLogWater, T }) {
  const hr=new Date().getHours(), greeting=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const dateStr=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const latest=weightLog.length?weightLog[weightLog.length-1].weight:null;
  const change=latest?(latest-67).toFixed(1):null;
  const remaining=Math.max(Math.round(TARGETS.kcal-totals.kcal),0);
  const weekTrainCount=sessions.filter(s=>{const d=new Date(s.date+"T00:00:00");const w=new Date();w.setDate(w.getDate()-7);return d>=w;}).length;
  const weekAvgKcal=weeklyData.filter(d=>d.kcal>0).length?Math.round(weeklyData.reduce((s,d)=>s+d.kcal,0)/weeklyData.filter(d=>d.kcal>0).length):0;
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <div style={{padding:"52px 20px 28px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:10}}>MY FITNESS HUB</Lbl>
        <div style={{fontSize:26,fontWeight:900,color:T.text,marginBottom:4,letterSpacing:-0.5}}>{greeting} 👋</div>
        <div style={{fontSize:13,color:T.textSub}}>{dateStr}</div>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        {/* Calorie card */}
        <div style={{background:T.surface,borderRadius:24,padding:"22px",marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <Ring value={totals.kcal} max={TARGETS.kcal} color={T.accent} size={96} stroke={8}>
              <div style={{fontSize:20,fontWeight:900,color:T.text,lineHeight:1}}>{Math.round(totals.kcal)}</div>
              <div style={{fontSize:9,color:T.textSub,marginTop:2,fontFamily:"monospace"}}>KCAL</div>
            </Ring>
            <div style={{flex:1}}>
              <MacroRow label="Protein" value={totals.protein} target={TARGETS.protein} color="#22c55e"/>
              <MacroRow label="Carbs"   value={totals.carbs}   target={TARGETS.carbs}   color="#4facfe"/>
              <MacroRow label="Fat"     value={totals.fat}     target={TARGETS.fat}     color="#f59e0b"/>
            </div>
          </div>
        </div>
        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {[["REMAINING",remaining+" kcal",remaining>0?T.accent:T.success],["WEIGHT",latest?latest+"kg":"—",T.text],["TRAINED",weekTrainCount+" sessions",weekTrainCount>0?T.success:T.textSub]].map(([l,v,c])=>(
            <div key={l} style={{background:T.surface,borderRadius:16,padding:"14px 10px",textAlign:"center",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:9,color:T.textMuted,fontFamily:"monospace",letterSpacing:1,marginBottom:6}}>{l}</div>
              <div style={{fontSize:15,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
              {l==="WEIGHT"&&change&&<div style={{fontSize:9,color:parseFloat(change)<=0?T.success:T.danger,marginTop:4}}>{parseFloat(change)<=0?"↓":"↑"}{Math.abs(change)}kg</div>}
            </div>
          ))}
        </div>
        <WeeklyAnalysisCard sessions={sessions} weeklyData={weeklyData} T={T}/>
        {/* 7-day calories */}
        {weeklyData.length>0&&(
          <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
            <Lbl color={T.accent} style={{marginBottom:6}}>7-DAY CALORIES</Lbl>
            <div style={{fontSize:12,color:T.textSub,marginBottom:14}}>Avg {weekAvgKcal} kcal · Target {TARGETS.kcal}</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyData} margin={{top:0,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="shortLabel" tick={{fontSize:10,fill:T.textMuted}}/>
                <YAxis tick={{fontSize:9,fill:T.textMuted}} domain={[0,Math.max(TARGETS.kcal*1.2,500)]}/>
                <Tooltip contentStyle={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}} formatter={v=>[v+" kcal","Calories"]}/>
                <ReferenceLine y={TARGETS.kcal} stroke={T.accent+"60"} strokeDasharray="4 4"/>
                <Bar dataKey="kcal" fill={T.accent} radius={[5,5,0,0]} opacity={0.9}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* 7-day protein */}
        {weeklyData.length>0&&(
          <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
            <Lbl color={T.accent} style={{marginBottom:6}}>7-DAY PROTEIN</Lbl>
            <div style={{fontSize:12,color:T.textSub,marginBottom:14}}>Target {TARGETS.protein}g/day</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weeklyData} margin={{top:0,right:0,left:-28,bottom:0}}>
                <XAxis dataKey="shortLabel" tick={{fontSize:10,fill:T.textMuted}}/>
                <YAxis tick={{fontSize:9,fill:T.textMuted}} domain={[0,180]}/>
                <Tooltip contentStyle={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}} formatter={v=>[v+"g","Protein"]}/>
                <ReferenceLine y={TARGETS.protein} stroke="#22c55e60" strokeDasharray="4 4"/>
                <Bar dataKey="protein" fill="#22c55e" radius={[5,5,0,0]} opacity={0.9}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Supplements */}
        <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Lbl color={T.accent}>SUPPLEMENTS</Lbl>
            <div style={{fontSize:13,fontWeight:700,color:suppLog.length===SUPPLEMENTS.length?T.success:T.textSub}}>{suppLog.length}/{SUPPLEMENTS.length}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {SUPPLEMENTS.map(s=>(
              <div key={s.id} style={{padding:"6px 14px",borderRadius:99,background:suppLog.includes(s.id)?s.color+"20":"#1e1e1e",border:`1px solid ${suppLog.includes(s.id)?s.color+"50":T.border}`,fontSize:12,color:suppLog.includes(s.id)?s.color:T.textMuted,fontWeight:600}}>
                {suppLog.includes(s.id)?"✓ ":""}{s.label.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>
        {/* Water */}
        <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Lbl color={T.accent}>WATER</Lbl>
            <div style={{fontSize:13,fontWeight:700,color:waterLog>=10?T.success:"#4facfe"}}>{waterLog*250}ml / 2500ml</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {Array.from({length:10},(_,i)=>(
              <button key={i} type="button" onClick={()=>onLogWater(waterLog===i+1?i:i+1)}
                style={{width:42,height:42,borderRadius:10,border:`1px solid ${i<waterLog?"#4facfe50":T.border}`,background:i<waterLog?"#4facfe20":T.surfaceAlt,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:i<waterLog?"#4facfe":T.textMuted}}>
                {i<waterLog?"💧":"○"}
              </button>
            ))}
          </div>
          <MiniBar value={waterLog} max={10} color="#4facfe" height={4}/>
          {waterLog>=10&&<div style={{fontSize:12,color:T.success,fontWeight:600,textAlign:"center",marginTop:10}}>🎉 Daily target reached!</div>}
        </div>
        <button type="button" onClick={onExport} style={{width:"100%",padding:"14px",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:14,fontSize:13,fontWeight:600,cursor:"pointer",color:T.textSub,marginBottom:16}}>
          📥 Export Data (JSON)
        </button>
      </div>
    </div>
  );
}

// ── Log Tab ───────────────────────────────────────────────────────────────────
function LogTab({ foodLog, totals, onAdd, onRemove, myFoods, onSaveFood, onDeleteMyFood, meals, onSaveMeals, globalDate, onDateChange, T }) {
  const [subTab,setSubTab]=useState("quick"), [expandedMeal,setExpandedMeal]=useState(null), [toast,setToast]=useState(""), [searchQ,setSearchQ]=useState(""), [searchRes,setSearchRes]=useState([]), [manual,setManual]=useState({name:"",kcal:"",protein:"",carbs:"",fat:""}), [editingMeal,setEditingMeal]=useState(null), [newItem,setNewItem]=useState({name:"",kcal:"",protein:"",carbs:"",fat:""}), [qtyItem,setQtyItem]=useState(null), [showScan,setShowScan]=useState(false);
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2500);}
  function openQty(name,kcal,protein,carbs,fat,defaultQty=100,unit="g"){setQtyItem({name,kcal,protein,carbs,fat,defaultQty,unit});}
  function logItem(name,kcal,protein,carbs,fat){onAdd({id:Date.now()+"_"+Math.random(),name:String(name),kcal:Number(kcal)||0,protein:Number(protein)||0,carbs:Number(carbs)||0,fat:Number(fat)||0});showToast("✅ "+name+" added!");}
  function handleSearch(q){setSearchQ(q);if(!q.trim()){setSearchRes([]);return;}setSearchRes(FOOD_DB.filter(f=>f.name.toLowerCase().includes(q.toLowerCase())).slice(0,8));}
  function submitManual(){if(!manual.name.trim()||!manual.kcal)return;logItem(manual.name,manual.kcal,manual.protein,manual.carbs,manual.fat);setManual({name:"",kcal:"",protein:"",carbs:"",fat:""});}
  function removeMealItem(mealId,idx){onSaveMeals(meals.map(m=>m.id===mealId?{...m,items:m.items.filter((_,i)=>i!==idx)}:m));}
  function addMealItem(mealId){if(!newItem.name.trim()||!newItem.kcal)return;const item={name:newItem.name,kcal:Number(newItem.kcal)||0,protein:Number(newItem.protein)||0,carbs:Number(newItem.carbs)||0,fat:Number(newItem.fat)||0};onSaveMeals(meals.map(m=>m.id===mealId?{...m,items:[...m.items,item]}:m));setNewItem({name:"",kcal:"",protein:"",carbs:"",fat:""});showToast("✅ Item added!");}
  function resetMeal(mealId){const def=DEFAULT_MEALS.find(m=>m.id===mealId);if(!def)return;onSaveMeals(meals.map(m=>m.id===mealId?{...m,items:[...def.items]}:m));showToast("✅ Reset to default");}
  const tabs=[["quick","⚡ MEALS"],["myfoods","⭐ MY FOODS ("+myFoods.length+")"],["search","🔍 SEARCH"],["manual","✏️ MANUAL"],["log","📋 LOG ("+foodLog.length+")"]];
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <Toast msg={toast}/>
      {qtyItem&&<QuantityModal item={qtyItem} onConfirm={item=>{onAdd({id:Date.now()+"_"+Math.random(),...item});showToast("✅ "+item.name+" added!");setQtyItem(null);}} onClose={()=>setQtyItem(null)} T={T}/>}
      {showScan&&<NutritionScanModal onConfirm={food=>{onSaveFood(food);setShowScan(false);showToast("⭐ "+food.name+" saved!");}} onClose={()=>setShowScan(false)} T={T}/>}
      <div style={{padding:"52px 20px 20px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:8}}>FOOD LOG</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[["Kcal",Math.round(totals.kcal),T.accent],["Protein",Math.round(totals.protein)+"g","#22c55e"],["Carbs",Math.round(totals.carbs)+"g","#4facfe"],["Fat",Math.round(totals.fat)+"g","#f59e0b"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",background:T.surface,borderRadius:14,padding:"12px 4px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:9,color:T.textMuted,marginTop:2,fontFamily:"monospace"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <DateNav date={globalDate} onChange={onDateChange} T={T}/>
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} T={T}/>
      <div style={{padding:"14px 14px 0"}}>
        {/* MEALS */}
        {subTab==="quick"&&meals.map(meal=>{
          const tot=mealTotal(meal), isEditing=editingMeal===meal.id;
          return (
            <div key={meal.id} style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>{meal.time}</div>
                  <div style={{fontSize:17,fontWeight:700,color:T.text}}>{meal.emoji} {meal.label}</div>
                  <div style={{fontSize:12,color:T.textSub,marginTop:2}}>{Math.round(tot.kcal)} kcal · {Math.round(tot.protein)}g protein</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={()=>setEditingMeal(isEditing?null:meal.id)} style={{padding:"8px 14px",background:isEditing?T.accent:T.surfaceAlt,color:isEditing?"#000":T.textSub,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>
                    {isEditing?"Done":"✏️"}
                  </button>
                  <button type="button" onClick={()=>logItem(meal.label,tot.kcal,tot.protein,tot.carbs,tot.fat)} style={{padding:"8px 16px",background:T.accent,color:"#000",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,minHeight:40}}>+All</button>
                </div>
              </div>
              {isEditing&&(
                <div style={{background:T.surfaceAlt,borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:10}}>Editing {meal.label}</div>
                  {meal.items.map((item,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,background:T.surface,borderRadius:10,padding:"10px 12px",border:`1px solid ${T.border}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text}}>{item.name}</div>
                        <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{item.kcal} kcal · {item.protein}g P</div>
                      </div>
                      <button type="button" onClick={()=>removeMealItem(meal.id,idx)} style={{width:30,height:30,borderRadius:"50%",background:"#ff4d4d20",color:T.danger,border:`1px solid #ff4d4d30`,cursor:"pointer",fontSize:13}}>✕</button>
                    </div>
                  ))}
                  {myFoods.length>0&&(
                    <div style={{marginTop:12,marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:8}}>⭐ Add from My Foods</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:180,overflowY:"auto"}}>
                        {myFoods.map((food,fi)=>(
                          <button key={fi} type="button" onClick={()=>{onSaveMeals(meals.map(m=>m.id===meal.id?{...m,items:[...m.items,{name:food.name,kcal:food.kcal,protein:food.protein,carbs:food.carbs,fat:food.fat}]}:m));showToast("✅ "+food.name+" added!");}}
                            style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",textAlign:"left"}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:T.text}}>{food.name}</div>
                              <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{food.kcal} kcal · {food.protein}g P</div>
                            </div>
                            <div style={{fontSize:18,color:"#f59e0b",flexShrink:0}}>+</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{fontSize:11,fontWeight:700,color:"#4facfe",marginBottom:8}}>+ Add custom item</div>
                  <input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Item name *"
                    style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text,marginBottom:8,boxSizing:"border-box"}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                    {[["kcal","Kcal *",T.accent],["protein","Protein","#22c55e"],["carbs","Carbs","#4facfe"],["fat","Fat","#f59e0b"]].map(([k,l,c])=>(
                      <div key={k}>
                        <div style={{fontSize:9,color:c,marginBottom:3,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>{l.toUpperCase()}</div>
                        <input type="number" value={newItem[k]} onChange={e=>setNewItem(p=>({...p,[k]:e.target.value}))} placeholder="0"
                          style={{width:"100%",padding:"9px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:14,fontFamily:"inherit",outline:"none",background:T.surface,color:T.text,boxSizing:"border-box"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button type="button" onClick={()=>addMealItem(meal.id)} style={{padding:"10px",background:T.accent,color:"#000",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>+ Add Item</button>
                    <button type="button" onClick={()=>resetMeal(meal.id)} style={{padding:"10px",background:"#ff4d4d15",color:T.danger,border:`1px solid #ff4d4d30`,borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>Reset</button>
                  </div>
                </div>
              )}
              {!isEditing&&(
                <button type="button" onClick={()=>setExpandedMeal(expandedMeal===meal.id?null:meal.id)} style={{width:"100%",padding:"10px",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",fontSize:12,color:T.textSub,fontWeight:600}}>
                  {expandedMeal===meal.id?"▲ Hide":"▼ Add individual items"}
                </button>
              )}
              {!isEditing&&expandedMeal===meal.id&&(
                <div style={{marginTop:10}}>
                  {meal.items.map((item,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:10,background:T.surfaceAlt,borderRadius:12,padding:"12px",marginBottom:8,border:`1px solid ${T.border}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:6}}>{item.name}</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                          {[["Kcal",item.kcal,T.accent],["P",item.protein+"g","#22c55e"],["C",item.carbs+"g","#4facfe"],["F",item.fat+"g","#f59e0b"]].map(([l,v,c])=>(
                            <div key={l} style={{textAlign:"center",background:T.surface,borderRadius:7,padding:"4px 2px",border:`1px solid ${T.border}`}}>
                              <div style={{fontSize:11,fontWeight:700,color:c}}>{typeof v==="number"?Math.round(v):v}</div>
                              <div style={{fontSize:9,color:T.textMuted}}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={()=>openQty(item.name,item.kcal,item.protein,item.carbs,item.fat,item.defaultQty||100,item.unit||"g")} style={{width:48,height:48,borderRadius:12,background:T.accent,color:"#000",border:"none",cursor:"pointer",fontSize:24,flexShrink:0}}>+</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* MY FOODS */}
        {subTab==="myfoods"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,color:T.textSub}}>Tap + to log</div>
              <button type="button" onClick={()=>setShowScan(true)} style={{padding:"8px 16px",background:T.accent,color:"#000",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>📸 Scan Label</button>
            </div>
            {myFoods.length===0?(
              <div style={{background:T.surface,borderRadius:20,padding:"40px 20px",textAlign:"center",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:40,marginBottom:12}}>⭐</div>
                <div style={{fontSize:15,fontWeight:600,color:T.textSub,marginBottom:6}}>No saved foods yet</div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:18}}>Scan a label or add manually</div>
                <button type="button" onClick={()=>setShowScan(true)} style={{padding:"12px 24px",background:T.accent,color:"#000",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer"}}>📸 Scan Label</button>
              </div>
            ):(
              myFoods.map((food,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:T.surface,borderRadius:16,padding:"14px 16px",marginBottom:8,border:`1px solid ${T.border}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{food.name}</div>
                    <div style={{display:"flex",gap:10,fontSize:11}}>
                      <span style={{color:T.accent,fontWeight:700}}>{food.kcal} kcal</span>
                      <span style={{color:"#22c55e"}}>{food.protein}g P</span>
                      <span style={{color:"#4facfe"}}>{food.carbs}g C</span>
                      <span style={{color:"#f59e0b"}}>{food.fat}g F</span>
                    </div>
                  </div>
                  <button type="button" onClick={()=>onDeleteMyFood(food.name)} style={{width:32,height:32,borderRadius:"50%",background:"#ff4d4d15",color:T.danger,border:`1px solid #ff4d4d30`,cursor:"pointer",fontSize:14}}>✕</button>
                  <button type="button" onClick={()=>openQty(food.name,food.kcal,food.protein,food.carbs,food.fat)} style={{width:48,height:48,borderRadius:12,background:T.accent,color:"#000",border:"none",cursor:"pointer",fontSize:22}}>+</button>
                </div>
              ))
            )}
          </div>
        )}
        {/* SEARCH */}
        {subTab==="search"&&(
          <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
            <Lbl color={T.accent} style={{marginBottom:10}}>SEARCH FOODS</Lbl>
            <input value={searchQ} onChange={e=>handleSearch(e.target.value)} placeholder="e.g. banana, dal, paneer..."
              style={{width:"100%",padding:"13px 16px",borderRadius:14,border:`1px solid ${T.border}`,fontSize:15,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,marginBottom:12,boxSizing:"border-box"}}/>
            {searchRes.map((food,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:T.surfaceAlt,borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:4}}>{food.name}</div>
                  <div style={{display:"flex",gap:10,fontSize:11}}><span style={{color:T.accent,fontWeight:700}}>{food.kcal} kcal</span><span style={{color:"#22c55e"}}>{food.protein}g P</span></div>
                </div>
                <button type="button" onClick={()=>openQty(food.name,food.kcal,food.protein,food.carbs,food.fat)} style={{width:48,height:48,borderRadius:12,background:T.accent,color:"#000",border:"none",cursor:"pointer",fontSize:22}}>+</button>
              </div>
            ))}
            {searchQ&&searchRes.length===0&&<div style={{textAlign:"center",padding:"24px",color:T.textSub,fontSize:13}}>No results. Try Manual.</div>}
          </div>
        )}
        {/* MANUAL */}
        {subTab==="manual"&&(
          <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <Lbl color={T.accent}>MANUAL ENTRY</Lbl>
              <button type="button" onClick={()=>setShowScan(true)} style={{padding:"8px 14px",background:T.accent,color:"#000",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>📸 Scan</button>
            </div>
            <input value={manual.name} onChange={e=>setManual(p=>({...p,name:e.target.value}))} placeholder="Food name *"
              style={{width:"100%",padding:"13px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:14,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,marginBottom:12,boxSizing:"border-box"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[["Calories *","kcal",T.accent],["Protein (g)","protein","#22c55e"],["Carbs (g)","carbs","#4facfe"],["Fat (g)","fat","#f59e0b"]].map(([label,key,color])=>(
                <div key={key}>
                  <div style={{fontSize:10,color,marginBottom:5,fontFamily:"monospace",fontWeight:700,letterSpacing:1}}>{label.toUpperCase()}</div>
                  <input type="number" value={manual[key]} onChange={e=>setManual(p=>({...p,[key]:e.target.value}))} placeholder="0"
                    style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:16,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
            <button type="button" onClick={submitManual} style={{width:"100%",padding:"15px",background:T.accent,color:"#000",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>+ Add to Log</button>
            {manual.name&&manual.kcal&&(
              <button type="button" onClick={()=>{onSaveFood({name:manual.name,kcal:Number(manual.kcal)||0,protein:Number(manual.protein)||0,carbs:Number(manual.carbs)||0,fat:Number(manual.fat)||0});showToast("⭐ Saved to My Foods!");}}
                style={{width:"100%",padding:"12px",background:T.surfaceAlt,color:"#f59e0b",border:`1px solid #f59e0b40`,borderRadius:14,fontSize:13,fontWeight:700,cursor:"pointer"}}>⭐ Save to My Foods</button>
            )}
          </div>
        )}
        {/* LOG */}
        {subTab==="log"&&(
          <div>
            {foodLog.length===0?(
              <div style={{background:T.surface,borderRadius:20,padding:"60px 20px",textAlign:"center",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:44,marginBottom:14}}>📋</div>
                <div style={{fontSize:15,fontWeight:600,color:T.textSub}}>Nothing logged yet</div>
                <div style={{fontSize:12,color:T.textMuted,marginTop:6}}>{globalDate===getToday()?"Today":fmtDateLong(globalDate)}</div>
              </div>
            ):(
              <>
                <div style={{background:T.surface,borderRadius:20,padding:"16px 18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <Lbl color={T.accent} style={{marginBottom:10}}>TOTAL — {globalDate===getToday()?"TODAY":fmtDateLong(globalDate).toUpperCase()}</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {[["Kcal",Math.round(totals.kcal),TARGETS.kcal,T.accent],["Prot",Math.round(totals.protein)+"g",TARGETS.protein+"g","#22c55e"],["Carb",Math.round(totals.carbs)+"g",TARGETS.carbs+"g","#4facfe"],["Fat",Math.round(totals.fat)+"g",TARGETS.fat+"g","#f59e0b"]].map(([l,v,t,c])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontSize:17,fontWeight:800,color:c}}>{v}</div>
                        <div style={{fontSize:9,color:T.textMuted}}>/ {t}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {foodLog.map(item=>(
                  <div key={item.id} style={{background:T.surface,borderRadius:16,padding:"14px 16px",marginBottom:8,border:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:8}}>{item.name}</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                          {[["Kcal",Math.round(item.kcal),T.accent],["P",Math.round(item.protein)+"g","#22c55e"],["C",Math.round(item.carbs)+"g","#4facfe"],["F",Math.round(item.fat)+"g","#f59e0b"]].map(([l,v,c])=>(
                            <div key={l} style={{textAlign:"center",background:T.surfaceAlt,borderRadius:8,padding:"5px",border:`1px solid ${T.border}`}}>
                              <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                              <div style={{fontSize:9,color:T.textMuted}}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={()=>onRemove(item.id)} style={{width:34,height:34,borderRadius:"50%",background:"#ff4d4d15",color:T.danger,border:`1px solid #ff4d4d30`,cursor:"pointer",fontSize:15,flexShrink:0,marginLeft:12}}>✕</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Train Tab ─────────────────────────────────────────────────────────────────
function TrainTab({ sessions, onSaveSession, onDeleteSession, weeklyData, globalDate, onDateChange, T }) {
  const [subTab,setSubTab]=useState("log"), [mode,setMode]=useState(null), [sessionName,setSessionName]=useState(""), [exercises,setExercises]=useState([]), [cardioData,setCardioData]=useState({type:"Incline Walk",duration:"",distance:"",notes:""}), [customEx,setCustomEx]=useState(""), [expandedSession,setExpandedSession]=useState(null), [progressEx,setProgressEx]=useState(""), [toast,setToast]=useState(""), [saving,setSaving]=useState(false), [autoSaved,setAutoSaved]=useState(false), [extraBlocks,setExtraBlocks]=useState([]), [showExtraBlock,setShowExtraBlock]=useState(false), [extraCardio,setExtraCardio]=useState({type:"Incline Walk",duration:"",distance:"",notes:""});
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2500);}
  const exDb=mode==="weights"?GYM_EXERCISES:mode==="bodyweight"?BW_EXERCISES:{};
  function addExercise(name){if(!name.trim()||exercises.find(e=>e.name===name))return;setExercises(prev=>[...prev,{name,sets:[{reps:"",weight:""}]}]);setCustomEx("");}
  function addSet(i){setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:[...e.sets,{reps:"",weight:""}]}:e));}
  function removeSet(i,si){setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:e.sets.filter((_,s)=>s!==si)}:e));}
  function updateSet(i,si,field,val){setExercises(prev=>prev.map((e,ei)=>ei===i?{...e,sets:e.sets.map((s,s2)=>s2===si?{...s,[field]:val}:s)}:e));setAutoSaved(false);clearTimeout(window._ast);window._ast=setTimeout(()=>setAutoSaved(true),800);}
  function removeExercise(i){setExercises(prev=>prev.filter((_,ei)=>ei!==i));}
  function saveExtraCardio(){if(!extraCardio.duration)return;setExtraBlocks(prev=>[...prev,{type:"cardio",cardioData:{...extraCardio}}]);setExtraCardio({type:"Incline Walk",duration:"",distance:"",notes:""});setShowExtraBlock(false);}
  async function saveSession(){
    if(mode==="cardio"&&!cardioData.duration)return;if((mode==="weights"||mode==="bodyweight")&&exercises.length===0)return;
    setSaving(true);const id="session_"+Date.now();
    const totalVolume=mode==="weights"?exercises.reduce((s,ex)=>s+ex.sets.reduce((s2,st)=>s2+((Number(st.reps)||0)*(Number(st.weight)||0)),0),0):0;
    const session={id,date:globalDate,mode,sessionName:sessionName||(mode==="cardio"?cardioData.type:"Session"),exercises:mode!=="cardio"?exercises:[],cardioData:mode==="cardio"?cardioData:null,totalVolume,extraBlocks,savedAt:new Date().toISOString()};
    await onSaveSession(session);showToast("✅ Session saved!");
    setMode(null);setSessionName("");setExercises([]);setCardioData({type:"Incline Walk",duration:"",distance:"",notes:""});setExtraBlocks([]);setShowExtraBlock(false);
    setSaving(false);setSubTab("history");
  }
  function getProgressData(exName){return sessions.filter(s=>s.exercises&&s.exercises.find(e=>e.name===exName)).map(s=>{const ex=s.exercises.find(e=>e.name===exName);const tw=Math.max(...ex.sets.map(st=>Number(st.weight)||0));const tr=ex.sets.find(st=>Number(st.weight)===tw)?.reps||0;return{date:fmtDate(s.date),weight:tw,reps:Number(tr)};}).slice(-12);}
  const allExNames=[...new Set(sessions.flatMap(s=>(s.exercises||[]).map(e=>e.name)))];
  function getPB(exName){const data=getProgressData(exName);if(!data.length)return null;return data.reduce((b,d)=>d.weight>b.weight?d:b,data[0]);}
  const tabs=[["log","📝 LOG"],["history","📋 HISTORY ("+sessions.length+")"],["progress","📈 PROGRESS"],["analysis","🧠 ANALYSIS"]];
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <Toast msg={toast}/>
      <div style={{padding:"52px 20px 20px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:8}}>TRAINING</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Today",sessions.filter(s=>s.date===globalDate).length>0?"✅":"—",T.accent],["This week",sessions.filter(s=>{const d=new Date(s.date+"T00:00:00");const w=new Date();w.setDate(w.getDate()-7);return d>=w;}).length,T.text],["Total",sessions.length,T.textSub]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",background:T.surface,borderRadius:14,padding:"14px 8px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:9,color:T.textMuted,marginTop:4,fontFamily:"monospace"}}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
      <DateNav date={globalDate} onChange={onDateChange} T={T}/>
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} T={T}/>
      <div style={{padding:"14px 14px 0"}}>
        {/* LOG SESSION */}
        {subTab==="log"&&(
          <div>
            {!mode?(
              <div>
                <div style={{background:T.surface,borderRadius:20,padding:"16px 18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <Lbl color={T.accent} style={{marginBottom:6}}>LOGGING FOR</Lbl>
                  <div style={{fontSize:17,fontWeight:700,color:globalDate===getToday()?T.accent:"#f59e0b"}}>{globalDate===getToday()?"Today — "+fmtDate(globalDate):fmtDateLong(globalDate)}</div>
                </div>
                <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
                  <Lbl color={T.accent} style={{marginBottom:14}}>CHOOSE TYPE</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[["🏋️","Weights","weights","Gym"],["💪","Bodyweight","bodyweight","Home"],["🏃","Cardio","cardio","Cardio"]].map(([emoji,label,val,sub])=>(
                      <button key={val} type="button" onClick={()=>setMode(val)} style={{padding:"20px 8px",borderRadius:16,border:`1px solid ${T.border}`,background:T.surfaceAlt,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                        <span style={{fontSize:30}}>{emoji}</span>
                        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{label}</span>
                        <span style={{fontSize:10,color:T.textMuted}}>{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ):(
              <div>
                <div style={{background:T.surface,borderRadius:20,padding:"16px 18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:15,fontWeight:700,color:T.text}}>{mode==="weights"?"🏋️ Weights":mode==="bodyweight"?"💪 Bodyweight":"🏃 Cardio"}</div>
                    <button type="button" onClick={()=>{setMode(null);setExercises([]);}} style={{padding:"6px 14px",background:T.surfaceAlt,border:`1px solid ${T.border}`,color:T.textSub,borderRadius:8,cursor:"pointer",fontSize:12}}>✕ Cancel</button>
                  </div>
                  <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder={mode==="cardio"?"Session name (optional)":"e.g. Chest & Triceps"}
                    style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:14,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,boxSizing:"border-box"}}/>
                </div>
                {mode==="cardio"&&(
                  <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                    <Lbl color={T.accent} style={{marginBottom:12}}>CARDIO DETAILS</Lbl>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                      {CARDIO_TYPES.map(t=>(
                        <button key={t} type="button" onClick={()=>setCardioData(p=>({...p,type:t}))} style={{padding:"8px 16px",borderRadius:99,border:`1px solid ${cardioData.type===t?T.accent:T.border}`,background:cardioData.type===t?T.accentDim:T.surfaceAlt,color:cardioData.type===t?T.accent:T.textSub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      {[["DURATION (mins) *","duration",""],["DISTANCE (km)","distance","0.1"]].map(([l,k,step])=>(
                        <div key={k}>
                          <div style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",marginBottom:5,letterSpacing:1}}>{l}</div>
                          <input type="number" step={step||1} value={cardioData[k]} onChange={e=>setCardioData(p=>({...p,[k]:e.target.value}))} placeholder="0"
                            style={{width:"100%",padding:"12px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:18,fontWeight:700,textAlign:"center",fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,boxSizing:"border-box"}}/>
                        </div>
                      ))}
                    </div>
                    {cardioData.duration&&cardioData.distance&&(
                      <div style={{background:T.accentDim,borderRadius:12,padding:"10px 14px",fontSize:13,color:T.accent,fontWeight:700,border:`1px solid ${T.accentMid}`}}>
                        Avg pace: {(Number(cardioData.duration)/Number(cardioData.distance)).toFixed(1)} min/km
                      </div>
                    )}
                  </div>
                )}
                {(mode==="weights"||mode==="bodyweight")&&(
                  <div>
                    <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                      <Lbl color={T.accent} style={{marginBottom:14}}>ADD EXERCISE</Lbl>
                      {Object.entries(exDb).map(([group,exList])=>(
                        <div key={group} style={{marginBottom:12}}>
                          <div style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",letterSpacing:2,marginBottom:8}}>{group.toUpperCase()}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {exList.map(ex=>{const added=!!exercises.find(e=>e.name===ex);return(
                              <button key={ex} type="button" onClick={()=>addExercise(ex)} disabled={added}
                                style={{padding:"7px 14px",borderRadius:99,border:`1px solid ${added?T.accent:T.border}`,background:added?T.accentDim:T.surfaceAlt,color:added?T.accent:T.textSub,fontSize:12,fontWeight:600,cursor:added?"default":"pointer"}}>
                                {ex} {added?"✓":"+"}
                              </button>
                            );})}
                          </div>
                        </div>
                      ))}
                      <div style={{display:"flex",gap:8,marginTop:10}}>
                        <input value={customEx} onChange={e=>setCustomEx(e.target.value)} placeholder="Custom exercise..."
                          style={{flex:1,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text}}/>
                        <button type="button" onClick={()=>addExercise(customEx)} style={{padding:"11px 18px",background:T.accent,color:"#000",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:700}}>Add</button>
                      </div>
                    </div>
                    {exercises.map((ex,ei)=>(
                      <div key={ei} style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{ex.name}</div>
                          <button type="button" onClick={()=>removeExercise(ei)} style={{width:30,height:30,borderRadius:"50%",background:"#ff4d4d15",color:T.danger,border:`1px solid #ff4d4d30`,cursor:"pointer",fontSize:14}}>✕</button>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:mode==="weights"?"48px 1fr 1fr 48px":"48px 1fr 48px",gap:8,marginBottom:8}}>
                          <div/>
                          <div style={{fontSize:11,color:"#22c55e",fontFamily:"monospace",fontWeight:700,textAlign:"center",letterSpacing:1}}>REPS</div>
                          {mode==="weights"&&<div style={{fontSize:11,color:"#4facfe",fontFamily:"monospace",fontWeight:700,textAlign:"center",letterSpacing:1}}>KG</div>}
                          <div/>
                        </div>
                        {ex.sets.map((set,si)=>(
                          <div key={si} style={{display:"grid",gridTemplateColumns:mode==="weights"?"48px 1fr 1fr 48px":"48px 1fr 48px",gap:8,marginBottom:8}}>
                            <div style={{textAlign:"center",fontSize:16,color:T.textMuted,lineHeight:"52px",fontWeight:700}}>{si+1}</div>
                            <input type="number" value={set.reps} onChange={e=>updateSet(ei,si,"reps",e.target.value)} placeholder="0"
                              style={{padding:"14px 8px",borderRadius:12,border:"1px solid #22c55e40",fontSize:20,fontWeight:800,textAlign:"center",fontFamily:"inherit",outline:"none",background:"#22c55e10",color:T.text,height:52,boxSizing:"border-box"}}/>
                            {mode==="weights"&&(
                              <input type="number" step="0.5" value={set.weight} onChange={e=>updateSet(ei,si,"weight",e.target.value)} placeholder="0"
                                style={{padding:"14px 8px",borderRadius:12,border:"1px solid #4facfe40",fontSize:20,fontWeight:800,textAlign:"center",fontFamily:"inherit",outline:"none",background:"#4facfe10",color:T.text,height:52,boxSizing:"border-box"}}/>
                            )}
                            <button type="button" onClick={()=>removeSet(ei,si)} style={{width:48,height:52,borderRadius:12,background:"#ff4d4d15",color:T.danger,border:"1px solid #ff4d4d30",cursor:"pointer",fontSize:18}}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={()=>addSet(ei)} style={{width:"100%",padding:"10px",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:12,cursor:"pointer",fontSize:13,color:T.textSub,fontWeight:600,marginTop:4}}>+ Add Set</button>
                      </div>
                    ))}
                  </div>
                )}
                {showExtraBlock&&(
                  <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:"1px solid #f59e0b40"}}>
                    <Lbl color="#f59e0b" style={{marginBottom:12}}>ADD CARDIO BLOCK</Lbl>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                      {CARDIO_TYPES.map(t=>(
                        <button key={t} type="button" onClick={()=>setExtraCardio(p=>({...p,type:t}))} style={{padding:"7px 14px",borderRadius:99,border:`1px solid ${extraCardio.type===t?"#f59e0b":T.border}`,background:extraCardio.type===t?"#f59e0b20":T.surfaceAlt,color:extraCardio.type===t?"#f59e0b":T.textSub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[["DURATION (mins) *","duration"],["DISTANCE (km)","distance"]].map(([l,k])=>(
                        <div key={k}>
                          <div style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",marginBottom:5}}>{l}</div>
                          <input type="number" value={extraCardio[k]} onChange={e=>setExtraCardio(p=>({...p,[k]:e.target.value}))} placeholder="0"
                            style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${T.border}`,fontSize:18,fontWeight:700,textAlign:"center",fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,boxSizing:"border-box"}}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <button type="button" onClick={saveExtraCardio} style={{padding:"12px",background:T.accent,color:"#000",border:"none",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:700}}>✅ Add Block</button>
                      <button type="button" onClick={()=>setShowExtraBlock(false)} style={{padding:"12px",background:T.surfaceAlt,color:T.textSub,border:`1px solid ${T.border}`,borderRadius:12,cursor:"pointer",fontSize:13}}>Cancel</button>
                    </div>
                  </div>
                )}
                {extraBlocks.map((block,i)=>(
                  <div key={i} style={{background:T.surface,borderRadius:16,padding:"14px 16px",marginBottom:8,border:"1px solid #22c55e40"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:12,fontWeight:700,color:T.success}}>✅ {block.cardioData?.type}</div><div style={{fontSize:11,color:T.textSub}}>{block.cardioData?.duration} mins{block.cardioData?.distance?" · "+block.cardioData.distance+"km":""}</div></div>
                      <button type="button" onClick={()=>setExtraBlocks(prev=>prev.filter((_,j)=>j!==i))} style={{width:28,height:28,borderRadius:"50%",background:"#ff4d4d15",color:T.danger,border:"1px solid #ff4d4d30",cursor:"pointer",fontSize:13}}>✕</button>
                    </div>
                  </div>
                ))}
                {!showExtraBlock&&(mode==="weights"||mode==="bodyweight")&&(
                  <button type="button" onClick={()=>setShowExtraBlock(true)} style={{width:"100%",padding:"12px",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:14,fontSize:13,fontWeight:600,color:T.textSub,cursor:"pointer",marginBottom:10}}>+ Add Cardio Block</button>
                )}
                {exercises.length>0&&<div style={{textAlign:"center",fontSize:11,color:autoSaved?T.success:T.textMuted,fontFamily:"monospace",marginBottom:10}}>{autoSaved?"✓ Progress recorded":"Recording..."}</div>}
                <button type="button" onClick={saveSession} disabled={saving} style={{width:"100%",padding:"18px",background:saving?"#333":T.accent,color:saving?"#666":"#000",border:"none",borderRadius:16,fontSize:16,fontWeight:700,cursor:saving?"not-allowed":"pointer",marginBottom:20}}>
                  {saving?"Saving…":"✅ Save Session"}
                </button>
              </div>
            )}
          </div>
        )}
        {/* HISTORY */}
        {subTab==="history"&&(
          <div>
            {sessions.length===0?(
              <div style={{background:T.surface,borderRadius:20,padding:"60px 20px",textAlign:"center",border:`1px solid ${T.border}`}}><div style={{fontSize:44,marginBottom:14}}>🏋️</div><div style={{fontSize:15,fontWeight:600,color:T.textSub}}>No sessions yet</div></div>
            ):(
              [...sessions].reverse().map(session=>(
                <div key={session.id} style={{background:T.surface,borderRadius:20,padding:"16px 18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <div onClick={()=>setExpandedSession(expandedSession===session.id?null:session.id)} style={{cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:11,color:T.accent,fontFamily:"monospace",fontWeight:700,marginBottom:4}}>{fmtDateLong(session.date).toUpperCase()}</div>
                        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{session.sessionName}</div>
                        <div style={{fontSize:12,color:T.textSub}}>{session.mode==="cardio"?`${session.cardioData?.duration} mins${session.cardioData?.distance?" · "+session.cardioData.distance+"km":""}`:
                         `${session.exercises?.length} exercises${session.totalVolume>0?" · "+Math.round(session.totalVolume)+"kg vol":""}`}</div>
                      </div>
                      <button type="button" onClick={e=>{e.stopPropagation();onDeleteSession(session.id);}} style={{width:32,height:32,borderRadius:"50%",background:"#ff4d4d15",color:T.danger,border:"1px solid #ff4d4d30",cursor:"pointer",fontSize:13}}>✕</button>
                    </div>
                  </div>
                  {expandedSession===session.id&&(
                    <div style={{marginTop:14,borderTop:`1px solid ${T.border}`,paddingTop:14}}>
                      {session.mode==="cardio"?(
                        <div style={{background:T.surfaceAlt,borderRadius:12,padding:12,border:`1px solid ${T.border}`}}>
                          {[["Type",session.cardioData?.type],["Duration",session.cardioData?.duration+" mins"],session.cardioData?.distance?["Distance",session.cardioData.distance+"km"]:null,session.cardioData?.distance&&session.cardioData?.duration?["Pace",(Number(session.cardioData.duration)/Number(session.cardioData.distance)).toFixed(1)+" min/km"]:null].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:T.textSub}}>{l}</span><span style={{fontSize:12,fontWeight:600,color:T.text}}>{v}</span></div>
                          ))}
                        </div>
                      ):(
                        session.exercises?.map((ex,i)=>(
                          <div key={i} style={{marginBottom:10,background:T.surfaceAlt,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`}}>
                            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:8}}>{ex.name}</div>
                            {ex.sets.map((set,si)=>(
                              <div key={si} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                <span style={{fontSize:12,color:T.textSub}}>Set {si+1}</span>
                                <span style={{fontSize:12,fontWeight:600,color:T.text}}>{set.reps} reps{set.weight?" @ "+set.weight+"kg":""}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                      {session.extraBlocks?.length>0&&(
                        <div style={{background:"#22c55e10",borderRadius:12,padding:"10px 14px",border:"1px solid #22c55e30"}}>
                          <div style={{fontSize:11,fontWeight:700,color:T.success,marginBottom:6}}>+ Additional blocks</div>
                          {session.extraBlocks.map((b,i)=><div key={i} style={{fontSize:12,color:T.textSub}}>{b.cardioData?.type}: {b.cardioData?.duration} mins{b.cardioData?.distance?" · "+b.cardioData.distance+"km":""}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {/* PROGRESS */}
        {subTab==="progress"&&(
          <div>
            {allExNames.length===0?(
              <div style={{background:T.surface,borderRadius:20,padding:"60px 20px",textAlign:"center",border:`1px solid ${T.border}`}}><div style={{fontSize:44,marginBottom:14}}>📈</div><div style={{fontSize:15,fontWeight:600,color:T.textSub}}>Log weight sessions to track progress</div></div>
            ):(
              <div>
                <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <Lbl color={T.accent} style={{marginBottom:14}}>PERSONAL BESTS</Lbl>
                  {allExNames.map(exName=>{const pb=getPB(exName);if(!pb||!pb.weight)return null;return(
                    <div key={exName} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:13,color:T.textSub}}>{exName}</span>
                      <span style={{fontSize:14,fontWeight:700,color:T.accent}}>{pb.weight}kg × {pb.reps} reps</span>
                    </div>
                  );})}
                </div>
                <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
                  <Lbl color={T.accent} style={{marginBottom:14}}>STRENGTH GRAPH</Lbl>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                    {allExNames.map(ex=>(
                      <button key={ex} type="button" onClick={()=>setProgressEx(ex)} style={{padding:"7px 14px",borderRadius:99,border:`1px solid ${progressEx===ex?T.accent:T.border}`,background:progressEx===ex?T.accentDim:T.surfaceAlt,color:progressEx===ex?T.accent:T.textSub,fontSize:12,fontWeight:600,cursor:"pointer"}}>{ex}</button>
                    ))}
                  </div>
                  {progressEx&&getProgressData(progressEx).length>0&&(
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={getProgressData(progressEx)} margin={{top:5,right:10,left:-20,bottom:0}}>
                        <XAxis dataKey="date" tick={{fontSize:9,fill:T.textMuted}}/>
                        <YAxis tick={{fontSize:9,fill:T.textMuted}} domain={["auto","auto"]} unit="kg"/>
                        <Tooltip contentStyle={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}} formatter={v=>[v+"kg","Top weight"]}/>
                        <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2.5} dot={{fill:T.accent,r:5,strokeWidth:0}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {subTab==="analysis"&&<WeeklyAnalysisCard sessions={sessions} weeklyData={weeklyData} T={T}/>}
      </div>
    </div>
  );
}

// ── Body Tab ──────────────────────────────────────────────────────────────────
function BodyTab({ weightLog, onAdd, photos, onAddPhoto, onDeletePhoto, bodyScanLog, onSaveScan, T }) {
  const [bodyTab,setBodyTab]=useState("scan"), [weightInput,setWeightInput]=useState(""), [saved,setSaved]=useState(false), [uploading,setUploading]=useState(false), [viewPhoto,setViewPhoto]=useState(null), [photoNote,setPhotoNote]=useState("");
  const today=getToday(), todayEntry=weightLog.find(w=>w.date===today), latest=weightLog.length?weightLog[weightLog.length-1].weight:null, change=latest?(latest-67).toFixed(1):null, bmi=latest?(latest/(1.68*1.68)).toFixed(1):null;
  const chartData=weightLog.slice(-30).map(w=>({date:fmtDate(w.date),weight:parseFloat(w.weight)}));
  const baseline={weight:66.2,bodyFat:22.7,muscleRate:46.3,bmi:23.5,bmr:1394,visceralFat:8};
  async function handleSave(){const w=parseFloat(weightInput);if(isNaN(w)||w<30||w>300)return;await onAdd({date:today,weight:w});setSaved(true);setWeightInput("");setTimeout(()=>setSaved(false),2000);}
  async function handlePhoto(e){const file=e.target.files[0];if(!file)return;setUploading(true);try{const dataUrl=await compress(file);await onAddPhoto({id:String(Date.now()),date:today,dataUrl,note:photoNote.trim()});setPhotoNote("");}catch(err){alert("Photo failed: "+(err.message||"Unknown"));}e.target.value="";setUploading(false);}
  // Tesseract scan
  const [scanning,setScanning]=useState(false), [scanResult,setScanResult]=useState(null), [scanError,setScanError]=useState(""), [scanProgress,setScanProgress]=useState(""), [scanSaved,setScanSaved]=useState(false), [tReady,setTReady]=useState(!!window.Tesseract);
  useEffect(()=>{if(window.Tesseract){setTReady(true);return;}const s=document.createElement("script");s.src="https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";s.onload=()=>setTReady(true);document.head.appendChild(s);},[]);
  const METRIC_KEYS=["weight","bodyFat","bmi","muscleRate","bodyWater","boneMass","proteinRate","bmr","visceralFat"];
  const RANGES={weight:[40,150],bodyFat:[5,50],bmi:[15,40],muscleRate:[25,70],bodyWater:[40,80],boneMass:[1,5],proteinRate:[10,30],bmr:[1000,2500],visceralFat:[1,30]};
  function fitRange(raw,key){if(raw===null||isNaN(raw))return null;const[lo,hi]=RANGES[key];for(const div of[1,10,100]){const c=raw/div;if(c>=lo&&c<=hi)return Math.round(c*10)/10;}return null;}
  async function readZoneNum(canvas,x1,y1,w,h,psm=8){const scale=5,zc=document.createElement("canvas");zc.width=w*scale+80;zc.height=h*scale+80;const zx=zc.getContext("2d");zx.fillStyle="white";zx.fillRect(0,0,zc.width,zc.height);const tmp=document.createElement("canvas");tmp.width=w;tmp.height=h;tmp.getContext("2d").putImageData(canvas.getContext("2d").getImageData(x1,y1,w,h),0,0);const id=tmp.getContext("2d").getImageData(0,0,w,h);const d=id.data;for(let i=0;i<d.length;i+=4){if(d[i]<130&&d[i+1]>100&&d[i+2]>170){d[i]=d[i+1]=d[i+2]=0;}else{d[i]=d[i+1]=d[i+2]=255;}d[i+3]=255;}tmp.getContext("2d").putImageData(id,0,0);zx.drawImage(tmp,40,40,w*scale,h*scale);try{const r=await window.Tesseract.recognize(zc,"eng",{tessedit_char_whitelist:"0123456789.",tessedit_pageseg_mode:String(psm)});const t=r.data.text.trim();const m=t.match(/\d+\.?\d*/);return m?parseFloat(m[0]):null;}catch{return null;}}
  async function analyseScan(e){const file=e.target.files[0];if(!file)return;e.target.value="";if(!tReady||!window.Tesseract){setScanError("OCR still loading.");return;}setScanning(true);setScanResult(null);setScanError("");setScanSaved(false);
    try{setScanProgress("Loading image...");const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file);});const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;canvas.getContext("2d").drawImage(img,0,0);const W=img.width,H=img.height;const full=canvas.getContext("2d").getImageData(0,0,W,H).data;function rowWhite(y){let w=0;for(let x=0;x<W;x++){const i=(y*W+x)*4;if(full[i]>230&&full[i+1]>230&&full[i+2]>230)w++;}return w/W;}const bands=[];let inB=false,bS=0;for(let y=0;y<H;y++){const iW=rowWhite(y)>0.5;if(iW&&!inB){inB=true;bS=y;}else if(!iW&&inB){if(y-bS>50)bands.push([bS,y]);inB=false;}}if(inB)bands.push([bS,H]);const gridBands=bands.filter(([s,e])=>e-s>100).slice(0,3);if(gridBands.length<3)throw new Error("Could not find all 3 grid rows.");const results={};for(let row=0;row<3;row++){const[bStart,bEnd]=gridBands[row];const bandH=bEnd-bStart;const numCY=Math.round(bStart+bandH*0.75);const colW=Math.floor(W/3);const half=50;setScanProgress("Reading row "+(row+1)+" of 3...");for(let col=0;col<3;col++){const key=METRIC_KEYS[row*3+col];const x1=col*colW,x2=Math.min((col+1)*colW,W);let raw=await readZoneNum(canvas,x1,numCY-half,x2-x1,half*2,8);let val=fitRange(raw,key);if(val===null){raw=await readZoneNum(canvas,x1,numCY-half,x2-x1,half*2,11);val=fitRange(raw,key);}results[key]=val;}}if(!results.weight)throw new Error("Weight not detected. Show full HF Fitness results grid.");setScanResult({...results,date:today});}catch(err){setScanError(err.message||"Could not read screenshot.");}setScanning(false);setScanProgress("");}
  async function confirmScan(){if(!scanResult)return;await onSaveScan(scanResult);setScanSaved(true);setTimeout(()=>setScanSaved(false),3000);}
  const latestScan=bodyScanLog.length?bodyScanLog[bodyScanLog.length-1]:null;
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <div style={{padding:"52px 20px 20px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:8}}>BODY STATS</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Current",latest?latest+"kg":"—",T.accent],["Change",change?`${parseFloat(change)<=0?"↓":"↑"}${Math.abs(change)}kg`:"—",change&&parseFloat(change)<=0?T.success:T.textSub],["BMI",bmi||"—","#4facfe"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",background:T.surface,borderRadius:14,padding:"14px 8px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:18,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
              <div style={{fontSize:9,color:T.textMuted,marginTop:4,fontFamily:"monospace"}}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
      <SubTabs tabs={[["scan","📷 SCAN"],["weight","⚖️ WEIGHT"],["photos","📸 PHOTOS ("+photos.length+")"]]} active={bodyTab} onChange={setBodyTab} T={T}/>
      <div style={{padding:"14px 14px 0"}}>
        {bodyTab==="scan"&&(
          <div>
            <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
              <Lbl color={T.accent} style={{marginBottom:8}}>HF FITNESS SCREENSHOT</Lbl>
              <div style={{fontSize:12,color:T.textSub,marginBottom:16,lineHeight:1.6}}>AI reads all values automatically. No internet needed after first load.</div>
              {!tReady&&<div style={{fontSize:12,color:T.warning,background:T.surfaceAlt,borderRadius:10,padding:"10px 14px",marginBottom:12}}>⏳ Loading scanner...</div>}
              <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:10}}>
                <div style={{padding:"18px",background:scanning||!tReady?"#333":T.accent,color:scanning||!tReady?"#666":"#000",textAlign:"center",fontSize:14,fontWeight:700,borderRadius:14,pointerEvents:"none"}}>
                  {scanning?"🔍 "+scanProgress:"📱 Upload HF Fitness Screenshot"}
                </div>
                <input type="file" accept="image/*" onChange={analyseScan} disabled={scanning||!tReady} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}}/>
              </div>
              {scanError&&<div style={{fontSize:12,color:T.danger,background:"#ff4d4d15",borderRadius:10,padding:"10px 14px",border:"1px solid #ff4d4d30"}}>{scanError}</div>}
            </div>
            {scanResult&&!scanSaved&&(
              <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,color:T.success,fontWeight:600,marginBottom:14}}>✅ Detected — {fmtDate(scanResult.date)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                  {[["Weight","weight","kg"],["Body Fat","bodyFat","%"],["BMI","bmi",""],["Muscle%","muscleRate","%"],["Water%","bodyWater","%"],["Bone","boneMass","kg"],["Protein%","proteinRate","%"],["BMR","bmr","kcal"],["Visceral","visceralFat",""]].map(([label,key,unit])=>(
                    <div key={key} style={{background:T.surfaceAlt,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:9,color:T.textMuted,fontFamily:"monospace",marginBottom:4}}>{label.toUpperCase()}</div>
                      <div style={{fontSize:16,fontWeight:800,color:scanResult[key]!=null?T.text:"#333"}}>{scanResult[key]!=null?scanResult[key]:"—"}<span style={{fontSize:10,color:T.textMuted}}>{unit}</span></div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={confirmScan} style={{width:"100%",padding:"15px",background:T.accent,color:"#000",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer"}}>💾 Save to Body Log</button>
              </div>
            )}
            {scanSaved&&<div style={{background:T.surface,borderRadius:20,padding:"28px",textAlign:"center",border:"1px solid #22c55e40",marginBottom:10}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontSize:15,fontWeight:700,color:T.success}}>Saved!</div></div>}
            {latestScan&&(
              <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                <Lbl color={T.accent} style={{marginBottom:14}}>PROGRESS VS BASELINE</Lbl>
                {[["Weight","weight","kg",true],["Body Fat","bodyFat","%",true],["Muscle Rate","muscleRate","%",false],["BMI","bmi","",true],["Visceral Fat","visceralFat","",true],["BMR","bmr","kcal",false]].map(([label,key,unit,lowerBetter])=>{
                  if(latestScan[key]==null)return null;
                  const diff=(latestScan[key]-baseline[key]).toFixed(1);
                  const isGood=lowerBetter?parseFloat(diff)<0:parseFloat(diff)>0;
                  const arrow=parseFloat(diff)<0?"↓":parseFloat(diff)>0?"↑":"→";
                  const color=parseFloat(diff)===0?T.textSub:isGood?T.success:T.danger;
                  return(
                    <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontSize:13,color:T.textSub}}>{label}</span>
                      <div><span style={{fontSize:15,fontWeight:700,color:T.text}}>{latestScan[key]}{unit}</span><span style={{fontSize:12,color,fontWeight:700,marginLeft:8}}>{arrow} {Math.abs(parseFloat(diff))}{unit}</span></div>
                    </div>
                  );
                })}
                <div style={{fontSize:11,color:T.textMuted,textAlign:"center",marginTop:10}}>Baseline: 66.2kg · 22.7% BF · 46.3% muscle</div>
              </div>
            )}
            {bodyScanLog.length>1&&(
              <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
                <Lbl color={T.accent} style={{marginBottom:14}}>SCAN HISTORY ({bodyScanLog.length})</Lbl>
                {[...bodyScanLog].reverse().map((scan,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{fmtDate(scan.date)}</div><div style={{fontSize:11,color:T.textSub,marginTop:2}}>{scan.weight&&scan.weight+"kg"}{scan.bodyFat&&" · "+scan.bodyFat+"% BF"}{scan.visceralFat&&" · VF:"+scan.visceralFat}</div></div>
                    {scan.weight&&<div style={{fontSize:13,fontWeight:700,color:scan.weight<baseline.weight?T.success:T.danger}}>{scan.weight<baseline.weight?"↓":"↑"}{Math.abs(scan.weight-baseline.weight).toFixed(1)}kg</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {bodyTab==="weight"&&(
          <div>
            <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
              <Lbl color={T.accent} style={{marginBottom:12}}>{todayEntry?"TODAY: "+todayEntry.weight+"KG":"LOG TODAY'S WEIGHT"}</Lbl>
              <div style={{display:"flex",gap:10}}>
                <input type="number" step="0.1" value={weightInput} onChange={e=>setWeightInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder={todayEntry?"Update ("+todayEntry.weight+")":"e.g. 63.5"}
                  style={{flex:1,padding:"16px",borderRadius:14,border:`1px solid ${T.border}`,fontSize:22,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,fontWeight:700}}/>
                <button type="button" onClick={handleSave} style={{padding:"16px 24px",background:T.accent,color:"#000",borderRadius:14,border:"none",cursor:"pointer",fontSize:16,fontWeight:700,minWidth:80}}>{saved?"✅":"Save"}</button>
              </div>
              <div style={{fontSize:11,color:T.textMuted,marginTop:10}}>⏰ Weigh first thing in the morning</div>
            </div>
            {chartData.length>1?(
              <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
                <Lbl color={T.accent} style={{marginBottom:14}}>WEIGHT TREND (30 DAYS)</Lbl>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <XAxis dataKey="date" tick={{fontSize:9,fill:T.textMuted}}/>
                    <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:T.textMuted}}/>
                    <Tooltip contentStyle={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}}/>
                    <ReferenceLine y={67} stroke={T.accent+"40"} strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2.5} dot={{fill:T.accent,r:4,strokeWidth:0}}/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{fontSize:10,color:T.textMuted,textAlign:"center",marginTop:6}}>Dashed = starting weight 67kg</div>
              </div>
            ):(
              <div style={{background:T.surface,borderRadius:20,padding:"40px 20px",textAlign:"center",border:`1px solid ${T.border}`}}><div style={{fontSize:13,color:T.textSub}}>Log weight daily to see your trend</div></div>
            )}
            <div style={{background:T.surface,borderRadius:20,padding:"18px",border:`1px solid ${T.border}`}}>
              <Lbl color={T.accent} style={{marginBottom:14}}>YOUR STATS</Lbl>
              {[["Starting Weight","67kg"],["Height","168cm"],["Age","28"],["Calorie Target","1,950 kcal"],["Protein Target","134g/day"],["Body Fat (baseline)","22.7%"],["Visceral Fat (baseline)","8"],["BMI",bmi||"—"],["Goal","Body recomposition 💪"]].map(([l,v],i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                  <span style={{fontSize:13,color:T.textSub}}>{l}</span><span style={{fontSize:13,fontWeight:600,color:T.text}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {bodyTab==="photos"&&(
          <div>
            <div style={{background:T.surface,borderRadius:20,padding:"18px",marginBottom:10,border:`1px solid ${T.border}`}}>
              <Lbl color={T.accent} style={{marginBottom:8}}>ADD PROGRESS PHOTO</Lbl>
              <input type="text" value={photoNote} onChange={e=>setPhotoNote(e.target.value)} placeholder="Optional note (e.g. Week 3 front)"
                style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1px solid ${T.border}`,fontSize:13,fontFamily:"inherit",outline:"none",background:T.surfaceAlt,color:T.text,marginBottom:12,boxSizing:"border-box"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["📷","Take Photo","environment"],["🖼️","Upload",""]].map(([icon,label,capture])=>(
                  <div key={label} style={{position:"relative",borderRadius:14,overflow:"hidden"}}>
                    <div style={{padding:"18px 10px",background:label==="Take Photo"?T.accent:T.surfaceAlt,color:label==="Take Photo"?"#000":T.textSub,textAlign:"center",fontSize:13,fontWeight:700,border:`1px solid ${T.border}`,pointerEvents:"none"}}>
                      <div style={{fontSize:24,marginBottom:6}}>{icon}</div>{uploading?"Saving...":label}
                    </div>
                    <input type="file" accept="image/*" {...(capture?{capture}:{})} onChange={handlePhoto} disabled={uploading} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}}/>
                  </div>
                ))}
              </div>
            </div>
            {photos.length===0?(
              <div style={{background:T.surface,borderRadius:20,padding:"60px 20px",textAlign:"center",border:`1px solid ${T.border}`}}><div style={{fontSize:44,marginBottom:12}}>📸</div><div style={{fontSize:15,fontWeight:600,color:T.textSub}}>No photos yet</div></div>
            ):(
              <div>
                <div style={{fontSize:11,color:T.textMuted,fontFamily:"monospace",marginBottom:10}}>{photos.length} PHOTOS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[...photos].reverse().map(photo=>(
                    <div key={photo.id} onClick={()=>setViewPhoto(photo)} style={{cursor:"pointer",borderRadius:16,overflow:"hidden",position:"relative"}}>
                      <img src={photo.dataUrl} alt="Progress" style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}/>
                      <div style={{background:"linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)",padding:"20px 10px 10px",position:"absolute",bottom:0,left:0,right:0}}>
                        <div style={{fontSize:11,color:"#fff",fontWeight:700}}>{fmtDate(photo.date)}</div>
                        {photo.note&&<div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:2}}>{photo.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewPhoto&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:9999,display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",color:"#fff"}}>
                  <div><div style={{fontSize:14,fontWeight:700}}>{fmtDate(viewPhoto.date)}</div>{viewPhoto.note&&<div style={{fontSize:11,color:"#aaa"}}>{viewPhoto.note}</div>}</div>
                  <div style={{display:"flex",gap:10}}>
                    <button type="button" onClick={()=>{onDeletePhoto(viewPhoto.id);setViewPhoto(null);}} style={{padding:"8px 16px",background:T.danger,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>Delete</button>
                    <button type="button" onClick={()=>setViewPhoto(null)} style={{padding:"8px 16px",background:"#333",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700}}>Close</button>
                  </div>
                </div>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px 20px"}}>
                  <img src={viewPhoto.dataUrl} alt="Progress" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:12}}/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Supplements Tab ───────────────────────────────────────────────────────────
function SuppsTab({ suppLog, onToggle, globalDate, onDateChange, T }) {
  const pct=Math.round((suppLog.length/SUPPLEMENTS.length)*100);
  const groups=[{title:"Morning",items:SUPPLEMENTS.filter(s=>s.time==="Morning")},{title:"With Dinner",items:SUPPLEMENTS.filter(s=>s.time==="With Dinner")},{title:"Before Bed",items:SUPPLEMENTS.filter(s=>s.time==="Before Bed")}];
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <div style={{padding:"52px 20px 20px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:8}}>SUPPLEMENTS</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:14,color:T.textSub}}>Daily stack</span>
          <span style={{fontSize:14,fontWeight:700,color:pct===100?T.success:T.accent}}>{suppLog.length}/{SUPPLEMENTS.length} taken</span>
        </div>
        <div style={{height:6,background:T.border,borderRadius:99}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?T.success:T.accent,borderRadius:99,transition:"width 0.4s"}}/></div>
      </div>
      <DateNav date={globalDate} onChange={onDateChange} T={T}/>
      <div style={{padding:"14px 14px 0"}}>
        {groups.map(group=>(
          <div key={group.title} style={{marginBottom:10}}>
            <div style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",letterSpacing:2,marginBottom:8,paddingLeft:4}}>{group.title.toUpperCase()}</div>
            {group.items.map(supp=>{const done=suppLog.includes(supp.id);return(
              <button key={supp.id} type="button" onClick={()=>onToggle(supp.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:8,borderRadius:18,cursor:"pointer",textAlign:"left",background:done?supp.color+"15":T.surface,border:`1px solid ${done?supp.color+"40":T.border}`,transition:"all 0.2s"}}>
                <div style={{width:42,height:42,borderRadius:13,flexShrink:0,background:done?supp.color:"#1e1e1e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?18:20,color:done?"#fff":T.textMuted,fontWeight:700,border:`1px solid ${done?supp.color+"60":T.border}`}}>
                  {done?"✓":supp.emoji}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:done?supp.color:T.text}}>{supp.label}</div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{supp.time}</div>
                </div>
                {done&&<div style={{fontSize:20}}>✅</div>}
              </button>
            );})}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ settings, onSave, T, accent }) {
  const [local,setLocal]=useState(settings), [saved,setSaved]=useState(false);
  function save(){onSave(local);setSaved(true);setTimeout(()=>setSaved(false),2000);}
  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <div style={{padding:"52px 20px 28px",background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        <Lbl color={T.accent} style={{marginBottom:8}}>SETTINGS</Lbl>
        <div style={{fontSize:22,fontWeight:900,color:T.text}}>Appearance</div>
      </div>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{background:T.surface,borderRadius:20,padding:"20px",marginBottom:12,border:`1px solid ${T.border}`}}>
          <Lbl color={T.accent} style={{marginBottom:16}}>ACCENT COLOUR</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
            {ACCENT_COLORS.map(a=>(
              <button key={a.id} type="button" onClick={()=>setLocal(p=>({...p,accent:a.id}))} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 4px",borderRadius:14,border:`2px solid ${local.accent===a.id?a.value:T.border}`,background:local.accent===a.id?a.value+"20":T.surfaceAlt,cursor:"pointer"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:a.value,border:local.accent===a.id?"3px solid #fff":"2px solid transparent"}}/>
                <div style={{fontSize:9,color:local.accent===a.id?a.value:T.textMuted,fontWeight:700,fontFamily:"monospace"}}>{a.label.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{background:T.surface,borderRadius:20,padding:"20px",marginBottom:12,border:`1px solid ${T.border}`}}>
          <Lbl color={T.accent} style={{marginBottom:14}}>PREVIEW</Lbl>
          <div style={{background:T.surfaceAlt,borderRadius:14,padding:"16px",border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:getAccent(local.accent)+"20",border:`2px solid ${getAccent(local.accent)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏋️</div>
              <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>Your Fitness Hub</div><div style={{fontSize:12,color:T.textSub}}>Looking great 💪</div></div>
            </div>
            <div style={{height:6,background:T.border,borderRadius:99,marginBottom:10}}><div style={{height:"100%",width:"72%",background:getAccent(local.accent),borderRadius:99}}/></div>
            <div style={{display:"flex",gap:8}}>
              {["1950 kcal","134g P","230g C","55g F"].map((v,i)=>(
                <div key={i} style={{flex:1,textAlign:"center",background:T.surface,borderRadius:8,padding:"6px 4px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:i===0?getAccent(local.accent):["#22c55e","#4facfe","#f59e0b"][i-1]}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={save} style={{width:"100%",padding:"17px",background:saved?T.success:T.accent,color:"#000",border:"none",borderRadius:16,fontSize:16,fontWeight:700,cursor:"pointer"}}>
          {saved?"✅ Saved!":"Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("home"), [globalDate,setGlobalDate]=useState(getToday()), [foodLog,setFoodLog]=useState([]), [suppLog,setSuppLog]=useState([]), [weightLog,setWeightLog]=useState([]), [photos,setPhotos]=useState([]), [weeklyData,setWeeklyData]=useState([]), [myFoods,setMyFoods]=useState([]), [meals,setMeals]=useState(DEFAULT_MEALS), [sessions,setSessions]=useState([]), [bodyScanLog,setBodyScanLog]=useState([]), [waterLog,setWaterLog]=useState(0), [settings,setSettings]=useState({accent:"orange"}), [ready,setReady]=useState(false);

  const accent=getAccent(settings.accent);
  const T=tokens(accent);

  useEffect(()=>{
    (async()=>{
      const today=getToday();
      const [fd,sl,wd,mf,ml,bsl,wtr,stg]= await Promise.all([fbGet("food",today),fbGet("supplements",today),fbGet("stats","weight"),fbGet("data","myfoods"),fbGet("data","meals"),fbGet("data","bodyscans"),fbGet("water",today),fbGet("data","settings")]);
      const wl=wd?.entries||[];
      setFoodLog(fd?.items||[]); setSuppLog(sl?.taken||[]); setWeightLog(wl); setMyFoods(mf?.items||[]); setMeals(ml?.meals||DEFAULT_MEALS); setBodyScanLog(bsl?.scans||[]); setWaterLog(wtr?.glasses||0);
      if(stg?.accent) setSettings(stg);
      const [allPhotos,allSessions]=await Promise.all([fbGetAll("photos"),fbGetAll("sessions")]);
      allPhotos.sort((a,b)=>a.date.localeCompare(b.date)); setPhotos(allPhotos);
      allSessions.sort((a,b)=>a.date.localeCompare(b.date)); setSessions(allSessions);
      const days=[];
      for(let i=6;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i); const dateStr=d.toISOString().split("T")[0];
        const df=dateStr===today?(fd?.items||[]):((await fbGet("food",dateStr))?.items||[]);
        const wEntry=wl.find(w=>w.date===dateStr);
        days.push({date:dateStr,shortLabel:dayLabel(dateStr),kcal:Math.round(df.reduce((s,f)=>s+(Number(f.kcal)||0),0)),protein:Math.round(df.reduce((s,f)=>s+(Number(f.protein)||0),0)),weight:wEntry?wEntry.weight:null,sessions:allSessions.filter(s=>s.date===dateStr).length});
      }
      setWeeklyData(days); setReady(true);
    })();
  },[]);

  async function changeDate(date){setGlobalDate(date);const [fd,sl]=await Promise.all([fbGet("food",date),fbGet("supplements",date)]);setFoodLog(fd?.items||[]);setSuppLog(sl?.taken||[]);}
  async function addFood(item){const updated=[...foodLog,item];setFoodLog(updated);await fbSet("food",globalDate,{items:updated,date:globalDate});if(globalDate===getToday())setWeeklyData(prev=>prev.map(d=>d.date===globalDate?{...d,kcal:Math.round(updated.reduce((s,f)=>s+(Number(f.kcal)||0),0)),protein:Math.round(updated.reduce((s,f)=>s+(Number(f.protein)||0),0))}:d));}
  async function removeFood(id){const updated=foodLog.filter(f=>f.id!==id);setFoodLog(updated);await fbSet("food",globalDate,{items:updated,date:globalDate});}
  async function toggleSupp(id){const updated=suppLog.includes(id)?suppLog.filter(s=>s!==id):[...suppLog,id];setSuppLog(updated);await fbSet("supplements",globalDate,{taken:updated,date:globalDate});}
  async function addWeight(entry){const updated=[...weightLog.filter(w=>w.date!==entry.date),entry].sort((a,b)=>a.date.localeCompare(b.date));setWeightLog(updated);await fbSet("stats","weight",{entries:updated});setWeeklyData(prev=>prev.map(d=>d.date===entry.date?{...d,weight:entry.weight}:d));}
  async function addPhoto(photo){await fbSet("photos",photo.id,photo);setPhotos(prev=>[...prev,photo]);}
  async function deletePhoto(id){await fbDel("photos",id);setPhotos(prev=>prev.filter(p=>p.id!==id));}
  async function saveMyFood(food){const updated=[...myFoods.filter(f=>f.name!==food.name),food];setMyFoods(updated);await fbSet("data","myfoods",{items:updated});}
  async function deleteMyFood(name){const updated=myFoods.filter(f=>f.name!==name);setMyFoods(updated);await fbSet("data","myfoods",{items:updated});}
  async function saveMeals(updated){setMeals(updated);await fbSet("data","meals",{meals:updated});}
  async function saveSession(session){await fbSet("sessions",session.id,session);setSessions(prev=>[...prev,session].sort((a,b)=>a.date.localeCompare(b.date)));setWeeklyData(prev=>prev.map(d=>d.date===session.date?{...d,sessions:(d.sessions||0)+1}:d));}
  async function deleteSession(id){const s=sessions.find(s=>s.id===id);await fbDel("sessions",id);setSessions(prev=>prev.filter(s=>s.id!==id));if(s)setWeeklyData(prev=>prev.map(d=>d.date===s.date?{...d,sessions:Math.max((d.sessions||0)-1,0)}:d));}
  async function saveBodyScan(scan){const updated=[...bodyScanLog.filter(s=>s.date!==scan.date),scan].sort((a,b)=>a.date.localeCompare(b.date));setBodyScanLog(updated);await fbSet("data","bodyscans",{scans:updated});if(scan.weight){const wUp=[...weightLog.filter(w=>w.date!==scan.date),{date:scan.date,weight:scan.weight}].sort((a,b)=>a.date.localeCompare(b.date));setWeightLog(wUp);await fbSet("stats","weight",{entries:wUp});}}
  async function logWater(glasses){setWaterLog(glasses);await fbSet("water",getToday(),{glasses,date:getToday()});}
  async function saveSettings(s){setSettings(s);await fbSet("data","settings",s);}
  function exportData(){const data={foodLog,suppLog,weightLog,myFoods,meals,sessions,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="fitness-hub-"+getToday()+".json";a.click();URL.revokeObjectURL(url);}

  const totals=foodLog.reduce((acc,f)=>({kcal:acc.kcal+(Number(f.kcal)||0),protein:acc.protein+(Number(f.protein)||0),carbs:acc.carbs+(Number(f.carbs)||0),fat:acc.fat+(Number(f.fat)||0)}),{kcal:0,protein:0,carbs:0,fat:0});

  if(!ready) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0a0a0a"}}>
      <div style={{fontSize:44,marginBottom:16}}>🏋️</div>
      <div style={{fontSize:12,color:"#444",fontFamily:"monospace",letterSpacing:3}}>LOADING...</div>
    </div>
  );

  const TABS=[{id:"home",label:"HOME",e:"🏠"},{id:"log",label:"LOG",e:"📝"},{id:"train",label:"TRAIN",e:"🏋️"},{id:"body",label:"BODY",e:"⚖️"},{id:"supps",label:"SUPPS",e:"💊"},{id:"settings",label:"SET",e:"⚙️"}];

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:"Georgia,serif"}}>
      <div style={{paddingBottom:80}}>
        {tab==="home"     &&<HomeTab     totals={totals} suppLog={suppLog} weightLog={weightLog} weeklyData={weeklyData} sessions={sessions} onExport={exportData} waterLog={waterLog} onLogWater={logWater} T={T}/>}
        {tab==="log"      &&<LogTab      foodLog={foodLog} totals={totals} onAdd={addFood} onRemove={removeFood} myFoods={myFoods} onSaveFood={saveMyFood} onDeleteMyFood={deleteMyFood} meals={meals} onSaveMeals={saveMeals} globalDate={globalDate} onDateChange={changeDate} T={T}/>}
        {tab==="train"    &&<TrainTab    sessions={sessions} onSaveSession={saveSession} onDeleteSession={deleteSession} weeklyData={weeklyData} globalDate={globalDate} onDateChange={changeDate} T={T}/>}
        {tab==="body"     &&<BodyTab     weightLog={weightLog} onAdd={addWeight} photos={photos} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} bodyScanLog={bodyScanLog} onSaveScan={saveBodyScan} T={T}/>}
        {tab==="supps"    &&<SuppsTab    suppLog={suppLog} onToggle={toggleSupp} globalDate={globalDate} onDateChange={changeDate} T={T}/>}
        {tab==="settings" &&<SettingsTab settings={settings} onSave={saveSettings} T={T} accent={accent}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surface,zIndex:999,borderTop:`1px solid ${T.border}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(t=>(
          <button key={t.id} type="button" onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0 12px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative"}}>
            {tab===t.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,background:T.accent,borderRadius:99}}/>}
            <span style={{fontSize:20,lineHeight:1}}>{t.e}</span>
            <span style={{fontSize:8,fontWeight:700,fontFamily:"monospace",color:tab===t.id?T.accent:T.textMuted,letterSpacing:0.5}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
