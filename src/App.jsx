import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { db, UID } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
const ACCENT_COLORS = [
  { id: "orange", label: "Orange", value: "#ff6b35" },
  { id: "lime", label: "Lime", value: "#c8f65a" },
  { id: "blue", label: "Blue", value: "#4facfe" },
  { id: "purple", label: "Purple", value: "#a78bfa" },
  { id: "teal", label: "Teal", value: "#2dd4bf" },
];
function getAccent(id) {
  return ACCENT_COLORS.find((a) => a.id === id)?.value || "#ff6b35";
}
function tokens(accent) {
  return {
    bg: "#0a0a0a",
    surface: "#141414",
    surfaceAlt: "#1e1e1e",
    surfaceHigh: "#252525",
    border: "#2a2a2a",
    borderLight: "#333",
    text: "#ffffff",
    textSub: "#999999",
    textMuted: "#555555",
    accent,
    accentDim: accent + "22",
    accentMid: accent + "44",
    danger: "#ff4d4d",
    success: "#22c55e",
    warning: "#f59e0b",
  };
}
const TARGETS = { kcal: 1950, protein: 134, carbs: 230, fat: 55 };
const DEFAULT_MEALS = [
  {
    id: "breakfast",
    label: "Breakfast",
    emoji: "🌅",
    time: "7:00am",
    items: [
      {
        name: "Actimel Original 100ml",
        kcal: 73,
        protein: 3,
        carbs: 11,
        fat: 1.5,
        defaultQty: 100,
        unit: "ml",
      },
      {
        name: "ASDA Greek Yogurt 100g",
        kcal: 66,
        protein: 7,
        carbs: 8,
        fat: 0.5,
        defaultQty: 100,
        unit: "g",
      },
      {
        name: "Soya Protein Crispies 30g",
        kcal: 109,
        protein: 22.5,
        carbs: 2.3,
        fat: 0.7,
        defaultQty: 30,
        unit: "g",
      },
      {
        name: "Blueberries x5",
        kcal: 5,
        protein: 0,
        carbs: 1,
        fat: 0,
        defaultQty: 5,
        unit: "x",
      },
      {
        name: "Myprotein Whey Shake 25g",
        kcal: 109,
        protein: 17,
        carbs: 1.2,
        fat: 4,
        defaultQty: 25,
        unit: "g",
      },
    ],
  },
  {
    id: "lunch",
    label: "Lunch",
    emoji: "☀️",
    time: "1:00pm",
    items: [
      {
        name: "Chickpeas 150g (cooked)",
        kcal: 206,
        protein: 13,
        carbs: 26,
        fat: 4,
        defaultQty: 150,
        unit: "g",
      },
      {
        name: "Edamame Beans 100g",
        kcal: 155,
        protein: 12,
        carbs: 6.5,
        fat: 7.6,
        defaultQty: 100,
        unit: "g",
      },
      {
        name: "LM Vegan Sausages x2",
        kcal: 130,
        protein: 13,
        carbs: 5,
        fat: 5,
        defaultQty: 2,
        unit: "x",
      },
      {
        name: "Mixed Veg 150g",
        kcal: 50,
        protein: 3,
        carbs: 8,
        fat: 0.5,
        defaultQty: 150,
        unit: "g",
      },
    ],
  },
  {
    id: "dinner",
    label: "Dinner",
    emoji: "🌙",
    time: "6:00pm",
    items: [
      {
        name: "2 Rotlis (Aashirvaad atta)",
        kcal: 170,
        protein: 5.5,
        carbs: 36.5,
        fat: 0.7,
        defaultQty: 2,
        unit: "x",
      },
      {
        name: "Apetina Paneer 100g",
        kcal: 174,
        protein: 22,
        carbs: 3.2,
        fat: 8,
        defaultQty: 100,
        unit: "g",
      },
      {
        name: "Mixed salad veg",
        kcal: 15,
        protein: 1,
        carbs: 3,
        fat: 0,
        defaultQty: 80,
        unit: "g",
      },
      {
        name: "Green chutney + chilli sauce",
        kcal: 45,
        protein: 0.5,
        carbs: 9,
        fat: 0,
        defaultQty: 30,
        unit: "g",
      },
      {
        name: "Nasto 30g",
        kcal: 143,
        protein: 2,
        carbs: 17,
        fat: 7,
        defaultQty: 30,
        unit: "g",
      },
      {
        name: "KP Roasted Peanuts 30g",
        kcal: 177,
        protein: 8.5,
        carbs: 3.4,
        fat: 13.8,
        defaultQty: 30,
        unit: "g",
      },
      {
        name: "Myprotein Whey Shake 25g",
        kcal: 109,
        protein: 17,
        carbs: 1.2,
        fat: 4,
        defaultQty: 25,
        unit: "g",
      },
    ],
  },
];
const FOOD_DB = [
  {
    name: "Banana (medium)",
    kcal: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Apple (medium)",
    kcal: 72,
    protein: 0.4,
    carbs: 19,
    fat: 0.2,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Orange (medium)",
    kcal: 62,
    protein: 1.2,
    carbs: 15,
    fat: 0.2,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Mango 100g",
    kcal: 60,
    protein: 0.8,
    carbs: 15,
    fat: 0.4,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Greek Yogurt 100g",
    kcal: 66,
    protein: 7,
    carbs: 8,
    fat: 0.5,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Arla Skyr Vanilla 100g",
    kcal: 73,
    protein: 8.6,
    carbs: 8.6,
    fat: 0.2,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Whole Milk 200ml",
    kcal: 130,
    protein: 6.8,
    carbs: 9.4,
    fat: 7.4,
    defaultQty: 200,
    unit: "ml",
  },
  {
    name: "Paneer 100g (Apetina)",
    kcal: 174,
    protein: 22,
    carbs: 3.2,
    fat: 8,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Paneer 100g (Everest)",
    kcal: 347,
    protein: 20.9,
    carbs: 4.1,
    fat: 27.7,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Tofu 100g",
    kcal: 76,
    protein: 8,
    carbs: 1.9,
    fat: 4.8,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Chickpeas 100g (cooked)",
    kcal: 148,
    protein: 8,
    carbs: 18,
    fat: 3,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Lentils 100g (cooked)",
    kcal: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Edamame 100g",
    kcal: 155,
    protein: 12,
    carbs: 6.5,
    fat: 7.6,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Oats 100g (dry)",
    kcal: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Brown Rice 100g (cooked)",
    kcal: 112,
    protein: 2.3,
    carbs: 24,
    fat: 0.8,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "White Rice 100g (cooked)",
    kcal: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Wholemeal Bread (slice)",
    kcal: 78,
    protein: 3.5,
    carbs: 14,
    fat: 1,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Rotli (1 medium)",
    kcal: 85,
    protein: 2.8,
    carbs: 17,
    fat: 0.7,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Chapati (1 medium)",
    kcal: 80,
    protein: 2.5,
    carbs: 15,
    fat: 1,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Naan (1 medium)",
    kcal: 262,
    protein: 8.7,
    carbs: 45,
    fat: 5.1,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Peanut Butter 1 tbsp",
    kcal: 94,
    protein: 4,
    carbs: 3.1,
    fat: 8,
    defaultQty: 1,
    unit: "tbsp",
  },
  {
    name: "Almonds 30g",
    kcal: 173,
    protein: 6.3,
    carbs: 6,
    fat: 15,
    defaultQty: 30,
    unit: "g",
  },
  {
    name: "Almonds 5 nuts",
    kcal: 35,
    protein: 1.3,
    carbs: 1.2,
    fat: 3,
    defaultQty: 5,
    unit: "x",
  },
  {
    name: "Sweet Potato 100g",
    kcal: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Broccoli 100g",
    kcal: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Spinach 100g",
    kcal: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Dal 100g (cooked)",
    kcal: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    defaultQty: 100,
    unit: "g",
  },
  {
    name: "Biryani 200g",
    kcal: 320,
    protein: 18,
    carbs: 42,
    fat: 8,
    defaultQty: 200,
    unit: "g",
  },
  {
    name: "Samosa (1)",
    kcal: 150,
    protein: 3,
    carbs: 18,
    fat: 8,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Gathiya 20g",
    kcal: 100,
    protein: 2.8,
    carbs: 10,
    fat: 5.6,
    defaultQty: 20,
    unit: "g",
  },
  {
    name: "Crispy Bhindi 30g",
    kcal: 40,
    protein: 1.2,
    carbs: 4.2,
    fat: 1.5,
    defaultQty: 30,
    unit: "g",
  },
  {
    name: "Pizza slice",
    kcal: 250,
    protein: 10,
    carbs: 32,
    fat: 9,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Whey Protein 25g",
    kcal: 109,
    protein: 17,
    carbs: 1.2,
    fat: 4,
    defaultQty: 25,
    unit: "g",
  },
  {
    name: "Protein Bar (avg)",
    kcal: 200,
    protein: 20,
    carbs: 22,
    fat: 7,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "KP Peanuts 30g",
    kcal: 177,
    protein: 8.5,
    carbs: 3.4,
    fat: 13.8,
    defaultQty: 30,
    unit: "g",
  },
  {
    name: "Nasto mix 30g",
    kcal: 143,
    protein: 2,
    carbs: 17,
    fat: 7,
    defaultQty: 30,
    unit: "g",
  },
  {
    name: "Actimel 100ml",
    kcal: 73,
    protein: 3,
    carbs: 11,
    fat: 1.5,
    defaultQty: 100,
    unit: "ml",
  },
  {
    name: "Soya Crispies 30g",
    kcal: 109,
    protein: 22.5,
    carbs: 2.3,
    fat: 0.7,
    defaultQty: 30,
    unit: "g",
  },
  {
    name: "Coffee (black)",
    kcal: 2,
    protein: 0.3,
    carbs: 0,
    fat: 0,
    defaultQty: 1,
    unit: "x",
  },
  {
    name: "Orange Juice 200ml",
    kcal: 84,
    protein: 1.2,
    carbs: 20,
    fat: 0.2,
    defaultQty: 200,
    unit: "ml",
  },
  {
    name: "Creatine 3g",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    defaultQty: 3,
    unit: "g",
  },
];
const SUPPLEMENTS = [
  {
    id: "vitd",
    label: "Vitamin D",
    time: "Morning",
    emoji: "☀️",
    color: "#f59e0b",
  },
  {
    id: "iq",
    label: "IQ Supplement",
    time: "Morning",
    emoji: "🧠",
    color: "#4facfe",
  },
  {
    id: "ashwa",
    label: "Ashwagandha KSM-66",
    time: "With Dinner",
    emoji: "🌿",
    color: "#22c55e",
  },
  {
    id: "mag",
    label: "Magnesium Glycinate",
    time: "Before Bed",
    emoji: "😴",
    color: "#a78bfa",
  },
];
const GYM_EXERCISES = {
  Chest: [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Chest Flyes",
    "Cable Crossover",
    "Dips",
  ],
  Back: [
    "Deadlift",
    "Barbell Row",
    "Lat Pulldown",
    "Cable Row",
    "T-Bar Row",
    "Seated Row",
  ],
  Shoulders: [
    "Overhead Press",
    "Lateral Raises",
    "Front Raises",
    "Rear Delt Flyes",
    "Arnold Press",
    "Shrugs",
  ],
  Arms: [
    "Bicep Curl",
    "Hammer Curl",
    "Tricep Pushdown",
    "Skull Crushers",
    "Preacher Curl",
    "Tricep Dips",
  ],
  Legs: [
    "Squat",
    "Leg Press",
    "Romanian Deadlift",
    "Leg Curl",
    "Leg Extension",
    "Calf Raises",
    "Lunges",
  ],
  Core: ["Plank", "Cable Crunches", "Leg Raises", "Russian Twist", "Ab Wheel"],
};
const BW_EXERCISES = {
  Push: [
    "Push Ups",
    "Wide Push Ups",
    "Diamond Push Ups",
    "Pike Push Ups",
    "Dips",
  ],
  Pull: ["Pull Ups", "Chin Ups", "Inverted Rows"],
  Legs: ["Squats", "Lunges", "Jump Squats", "Glute Bridges", "Calf Raises"],
  Core: ["Plank", "Crunches", "Leg Raises", "Mountain Climbers", "Burpees"],
};
const CARDIO_TYPES = [
  "Incline Walk",
  "Treadmill",
  "Cross Trainer",
  "Cycling",
  "Rowing",
  "Running (outdoor)",
  "HIIT",
  "Swimming",
  "Other",
];
const getToday = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
};
const fmtDateLong = (d) => {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
};
const dayLabel = (d) => {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short",
    });
  } catch {
    return d;
  }
};
const mealTotal = (meal) =>
  meal.items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      protein: a.protein + i.protein,
      carbs: a.carbs + i.carbs,
      fat: a.fat + i.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
const avg = (arr) =>
  arr.length
    ? arr.reduce((s, n) => s + (Number(n) || 0), 0) / arr.length
    : null;
const lastNDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
const inLastDays = (date, n) => {
  const d = new Date(date + "T00:00:00");
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  start.setHours(0, 0, 0, 0);
  return d >= start;
};
const compress = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Read failed"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image failed"));
      img.onload = () => {
        try {
          const maxW = 480,
            scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas
            .getContext("2d")
            .drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
const userDoc = (col, id) => doc(db, "users", UID, col, id);
const fbGet = async (col, id) => {
  try {
    const snap = await getDoc(userDoc(col, id));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
};
const fbSet = async (col, id, data) => {
  try {
    await setDoc(userDoc(col, id), data);
  } catch (e) {
    console.error(e);
  }
};
const fbDel = async (col, id) => {
  try {
    await deleteDoc(userDoc(col, id));
  } catch {}
};
const fbGetAll = async (col) => {
  try {
    const snap = await getDocs(collection(db, "users", UID, col));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};
const normaliseFoodName = (name) =>
  String(name || "")
    .replace(/\s*\([^)]*\)\s*$/, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const cleanFoodForBank = (food) => ({
  name: String(food?.name || "").trim(),
  kcal: Number(food?.kcal) || 0,
  protein: Number(food?.protein) || 0,
  carbs: Number(food?.carbs) || 0,
  fat: Number(food?.fat) || 0,
  defaultQty: Number(food?.defaultQty) || 100,
  unit: food?.unit || "g",
  lastUsed: food?.lastUsed || new Date().toISOString(),
});
const mergeFoodBank = (foods) => {
  const map = new Map();
  (foods || []).forEach((f) => {
    const clean = cleanFoodForBank(f);
    const key = normaliseFoodName(clean.name);
    if (!key) return;
    const existing = map.get(key) || {};
    map.set(key, {
      ...existing,
      ...clean,
      lastUsed: clean.lastUsed || existing.lastUsed || new Date().toISOString(),
    });
  });
  return [...map.values()].sort((a, b) =>
    String(b.lastUsed || "").localeCompare(String(a.lastUsed || "")),
  );
};
function Ring({ value, max, color, size = 90, stroke = 7, children }) {
  const r = (size - stroke) / 2,
    circ = 2 * Math.PI * r,
    pct = Math.min(value / max, 1);
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      {" "}
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {" "}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={stroke}
        />{" "}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />{" "}
      </svg>{" "}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>{" "}
    </div>
  );
}
function Lbl({ children, color, style }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: color || "#ff6b35",
        fontFamily: "monospace",
        letterSpacing: 3,
        fontWeight: 600,
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}
function MiniBar({ value, max, color, height = 3 }) {
  return (
    <div style={{ height, background: "#2a2a2a", borderRadius: 99 }}>
      {" "}
      <div
        style={{
          height: "100%",
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />{" "}
    </div>
  );
}
function MacroRow({ label, value, target, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        {" "}
        <span style={{ fontSize: 12, color: "#999" }}>{label}</span>{" "}
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {Math.round(value)}g{" "}
          <span style={{ color: "#444", fontWeight: 400 }}>/ {target}g</span>
        </span>{" "}
      </div>{" "}
      <MiniBar value={value} max={target} color={color} />{" "}
    </div>
  );
}
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e1e1e",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 99999,
        border: "1px solid #333",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {msg}
    </div>
  );
}
function DateNav({ date, onChange, T }) {
  const isToday = date === getToday();
  const back = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    onChange(d.toISOString().split("T")[0]);
  };
  const fwd = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const n = d.toISOString().split("T")[0];
    if (n <= getToday()) onChange(n);
  };
  return (
    <div>
      {" "}
      <div
        style={{
          background: T.surface,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <button
          type="button"
          onClick={back}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.surfaceAlt,
            cursor: "pointer",
            fontSize: 18,
            color: T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>{" "}
        <input
          type="date"
          value={date}
          max={getToday()}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 12,
            border: `1px solid ${isToday ? T.accent : T.border}`,
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            background: T.surfaceAlt,
            textAlign: "center",
            fontWeight: 700,
            color: isToday ? T.accent : T.text,
            colorScheme: "dark",
          }}
        />{" "}
        <button
          type="button"
          onClick={fwd}
          disabled={isToday}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.surfaceAlt,
            cursor: isToday ? "not-allowed" : "pointer",
            fontSize: 18,
            color: isToday ? T.textMuted : T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>{" "}
        {!isToday && (
          <button
            type="button"
            onClick={() => onChange(getToday())}
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              background: T.accent,
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Today
          </button>
        )}{" "}
      </div>{" "}
      {!isToday && (
        <div
          style={{
            background: T.surfaceAlt,
            padding: "7px 16px",
            fontSize: 11,
            color: T.accent,
            fontWeight: 600,
            textAlign: "center",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          Editing: {fmtDateLong(date)}
        </div>
      )}{" "}
    </div>
  );
}
function SubTabs({ tabs, active, onChange, T }) {
  return (
    <div
      style={{
        display: "flex",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        overflowX: "auto",
      }}
    >
      {" "}
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            flexShrink: 0,
            padding: "13px 14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            color: active === key ? T.accent : T.textMuted,
            borderBottom: `2px solid ${active === key ? T.accent : "transparent"}`,
            letterSpacing: 0.5,
          }}
        >
          {" "}
          {label}{" "}
        </button>
      ))}{" "}
    </div>
  );
}
function NutritionScanModal({ onConfirm, onClose, T }) {
  const [scanning, setScanning] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [tReady, setTReady] = useState(!!window.Tesseract),
    [foodName, setFoodName] = useState(""),
    [editedMacros, setEditedMacros] = useState(null);
  useEffect(() => {
    if (window.Tesseract) {
      setTReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
    s.onload = () => setTReady(true);
    document.head.appendChild(s);
  }, []);
  function extractMacros(text) {
    let t = text.toLowerCase();
    t = t.replace(/(\d+)[,](?=\d)/g, "$1.");
    const r = {};
    const km = t.match(/(\d+)\s*kcal/);
    if (km) r.kcal = parseFloat(km[1]);
    else {
      const cm = t.match(/calorie[s]?\D{0,5}(\d+)/);
      if (cm) r.kcal = parseFloat(cm[1]);
    }
    const pm = t.match(/protein[^\d]*(\d+\.?\d*)/);
    if (pm) r.protein = parseFloat(pm[1]);
    const lines = t.split("\n");
    for (const l of lines) {
      if (/carbohydrat|total carb/.test(l) && !/of which|which/.test(l)) {
        const m = l.match(/(\d+\.?\d*)/);
        if (m) {
          r.carbs = parseFloat(m[1]);
          break;
        }
      }
    }
    for (const l of lines) {
      if (/\bfat\b/.test(l) && !/saturate|trans/.test(l)) {
        const nums = [...l.matchAll(/(\d+\.?\d*)/g)].map((m) =>
          parseFloat(m[1]),
        );
        const v = nums.find((n) => n > 0 && n < 100);
        if (v !== undefined) {
          r.fat = v;
          break;
        }
      }
    }
    return r;
  }
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (!tReady || !window.Tesseract) {
      setError("Scanner loading, try again.");
      return;
    }
    setScanning(true);
    setResult(null);
    setError("");
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(file);
      });
      const canvas = document.createElement("canvas");
      const scale = Math.min(3, 2400 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = g < 128 ? Math.max(0, g - 30) : Math.min(255, g + 30);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      ctx.putImageData(id, 0, 0);
      const ocr = await window.Tesseract.recognize(canvas, "eng", {
        tessedit_pageseg_mode: "6",
      });
      const macros = extractMacros(ocr.data.text);
      if (!macros.kcal && !macros.protein)
        throw new Error("Could not find nutrition info.");
      setResult(macros);
      setEditedMacros({ ...macros });
    } catch (err) {
      setError(err.message || "Could not read label.");
    }
    setScanning(false);
  }
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99998,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {" "}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: T.surface,
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 40px",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <div
          style={{
            width: 36,
            height: 4,
            background: T.border,
            borderRadius: 99,
            margin: "0 auto 18px",
          }}
        />{" "}
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: T.text,
            marginBottom: 4,
          }}
        >
          {" "}
          Scan Nutrition Label
        </div>{" "}
        <div
          style={{
            fontSize: 12,
            color: T.textSub,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Works with supermarket labels, app screenshots, websites.
        </div>{" "}
        {!result && (
          <div>
            {" "}
            {!tReady && (
              <div
                style={{
                  fontSize: 12,
                  color: T.warning,
                  background: T.surfaceAlt,
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 12,
                }}
              >
                ⏳ Loading scanner...
              </div>
            )}{" "}
            <div
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              {" "}
              <div
                style={{
                  padding: "18px",
                  background: scanning || !tReady ? "#333" : T.accent,
                  color: scanning || !tReady ? "#666" : "#000",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 14,
                  pointerEvents: "none",
                }}
              >
                {" "}
                {scanning ? "🔍 Reading label..." : "📷 Upload Label Photo"}{" "}
              </div>{" "}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={scanning || !tReady}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />{" "}
            </div>{" "}
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: T.danger,
                  background: "#ff4d4d15",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: `1px solid #ff4d4d30`,
                }}
              >
                {error}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {result && editedMacros && (
          <div>
            {" "}
            <div
              style={{
                fontSize: 12,
                color: T.success,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              ✅ Label read — check and correct if needed
            </div>{" "}
            <input
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Food name *"
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                background: T.surfaceAlt,
                color: T.text,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {" "}
              {[
                ["Calories", "kcal", T.accent],
                ["Protein (g)", "protein", "#22c55e"],
                ["Carbs (g)", "carbs", "#4facfe"],
                ["Fat (g)", "fat", "#f59e0b"],
              ].map(([l, k, c]) => (
                <div key={k}>
                  {" "}
                  <div
                    style={{
                      fontSize: 10,
                      color: c,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      marginBottom: 5,
                      letterSpacing: 1,
                    }}
                  >
                    {l.toUpperCase()}
                  </div>{" "}
                  <input
                    type="number"
                    step="0.1"
                    value={editedMacros[k] || ""}
                    onChange={(e) =>
                      setEditedMacros((p) => ({
                        ...p,
                        [k]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      fontSize: 18,
                      fontWeight: 700,
                      textAlign: "center",
                      fontFamily: "inherit",
                      outline: "none",
                      background: T.surfaceAlt,
                      color: T.text,
                      boxSizing: "border-box",
                    }}
                  />{" "}
                </div>
              ))}{" "}
            </div>{" "}
            <button
              type="button"
              disabled={!foodName.trim()}
              onClick={() =>
                onConfirm({
                  name: foodName.trim(),
                  kcal: editedMacros.kcal || 0,
                  protein: editedMacros.protein || 0,
                  carbs: editedMacros.carbs || 0,
                  fat: editedMacros.fat || 0,
                })
              }
              style={{
                width: "100%",
                padding: "15px",
                background: foodName.trim() ? T.accent : "#333",
                color: foodName.trim() ? "#000" : "#666",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: foodName.trim() ? "pointer" : "not-allowed",
                marginBottom: 10,
              }}
            >
              {" "}
              ⭐ Save to My Foods{" "}
            </button>{" "}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setEditedMacros(null);
                setFoodName("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: T.surfaceAlt,
                color: T.textSub,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {" "}
              Scan another{" "}
            </button>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function QuantityModal({ item, onConfirm, onClose, T }) {
  const [qty, setQty] = useState(item.defaultQty || 100);
  const base = item.defaultQty || 100,
    unit = item.unit || "g",
    ratio = Number(qty) / base;
  const scaled = {
    kcal: Math.round((item.kcal || 0) * ratio),
    protein: Math.round((item.protein || 0) * ratio * 10) / 10,
    carbs: Math.round((item.carbs || 0) * ratio * 10) / 10,
    fat: Math.round((item.fat || 0) * ratio * 10) / 10,
  };
  const presets =
    unit === "x" || unit === "tbsp"
      ? [1, 2, 3, 4, 5, 10]
      : unit === "ml"
        ? [50, 100, 150, 200, 250]
        : [25, 50, 75, 100, 125, 150, 200];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99998,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {" "}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: T.surface,
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 44px",
          border: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <div
          style={{
            width: 36,
            height: 4,
            background: T.border,
            borderRadius: 99,
            margin: "0 auto 18px",
          }}
        />{" "}
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            marginBottom: 4,
          }}
        >
          {item.name}
        </div>{" "}
        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 20 }}>
          Default: {base}
          {unit} · Adjust below
        </div>{" "}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {" "}
          <button
            type="button"
            onClick={() =>
              setQty((q) =>
                Math.max(
                  unit === "x" || unit === "tbsp" ? 1 : 5,
                  Number(q) -
                    (unit === "x" || unit === "tbsp"
                      ? 1
                      : unit === "ml"
                        ? 50
                        : 10),
                ),
              )
            }
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
            }}
          >
            −
          </button>{" "}
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}
          >
            {" "}
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: `2px solid ${T.accent}`,
                fontSize: 24,
                fontWeight: 800,
                textAlign: "center",
                fontFamily: "inherit",
                outline: "none",
                background: T.surfaceAlt,
                color: T.text,
              }}
            />{" "}
            <span style={{ fontSize: 16, color: T.textSub, fontWeight: 600 }}>
              {unit}
            </span>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={() =>
              setQty(
                (q) =>
                  Number(q) +
                  (unit === "x" || unit === "tbsp"
                    ? 1
                    : unit === "ml"
                      ? 50
                      : 10),
              )
            }
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
            }}
          >
            +
          </button>{" "}
        </div>{" "}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {" "}
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setQty(v)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: `1px solid ${Number(qty) === v ? T.accent : T.border}`,
                background: Number(qty) === v ? T.accentDim : T.surfaceAlt,
                color: Number(qty) === v ? T.accent : T.textSub,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {" "}
              {v}
              {unit}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {" "}
          {[
            ["Kcal", scaled.kcal, T.accent],
            ["Protein", scaled.protein + "g", "#22c55e"],
            ["Carbs", scaled.carbs + "g", "#4facfe"],
            ["Fat", scaled.fat + "g", "#f59e0b"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: T.surfaceAlt,
                borderRadius: 12,
                padding: "10px 4px",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div style={{ fontSize: 16, fontWeight: 800, color: c }}>
                {v}
              </div>{" "}
              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                {l}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        <button
          type="button"
          onClick={() =>
            onConfirm({
              ...item,
              name: `${item.name} (${qty}${unit})`,
              ...scaled,
            })
          }
          style={{
            width: "100%",
            padding: "16px",
            background: T.accent,
            color: "#000",
            border: "none",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {" "}
          + Add {qty}
          {unit} to Log{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
function WeeklyAnalysisCard({ sessions, weeklyData, T }) {
  const [copied, setCopied] = useState(false);
  function buildReport() {
    const ws = sessions.filter((s) => {
      const d = new Date(s.date + "T00:00:00");
      const w = new Date();
      w.setDate(w.getDate() - 7);
      return d >= w;
    });
    const active = weeklyData.filter((d) => d.kcal > 0);
    const avgK = active.length
      ? Math.round(active.reduce((s, d) => s + d.kcal, 0) / active.length)
      : 0;
    const avgP = active.length
      ? Math.round(active.reduce((s, d) => s + d.protein, 0) / active.length)
      : 0;
    const weights = weeklyData.filter((d) => d.weight).map((d) => d.weight);
    const wChange =
      weights.length >= 2
        ? (weights[weights.length - 1] - weights[0]).toFixed(1)
        : null;
    let r =
      "=== WEEKLY FITNESS REPORT ===\nWeek ending: " +
      new Date().toLocaleDateString("en-GB") +
      "\n\n";
    r +=
      "ABOUT ME:\nAge 28, 168cm, UK dentist. Goal: body recomposition 22.7%→12-14% BF. Vegetarian, no eggs.\nTarget: 1950 kcal | 134g protein\n\n--- NUTRITION ---\n";
    r +=
      "Avg kcal: " +
      avgK +
      " (target 1950)\nAvg protein: " +
      avgP +
      "g (target 134g)\nDays tracked: " +
      active.length +
      "/7\n";
    weeklyData.forEach((d) => {
      r +=
        "  " +
        d.shortLabel +
        ": " +
        d.kcal +
        " kcal, " +
        d.protein +
        "g protein\n";
    });
    r += "\n--- BODY ---\n";
    if (weights.length) {
      r += "Latest: " + weights[weights.length - 1] + "kg\n";
      if (wChange) r += "Change: " + wChange + "kg\n";
    } else r += "No weight logged\n";
    r += "\n--- TRAINING (" + ws.length + " sessions) ---\n";
    if (!ws.length) r += "No sessions logged\n";
    else
      ws.forEach((s) => {
        r +=
          "\n" +
          fmtDate(s.date) +
          " - " +
          s.sessionName +
          " (" +
          s.mode +
          ")\n";
        if (s.mode === "cardio")
          r +=
            "  " +
            s.cardioData?.type +
            ": " +
            s.cardioData?.duration +
            "mins" +
            (s.cardioData?.distance
              ? ", " + s.cardioData.distance + "km"
              : "") +
            "\n";
        else
          s.exercises?.forEach((ex) => {
            r += "  " + ex.name + ":\n";
            ex.sets.forEach((set, i) => {
              r +=
                "    Set " +
                (i + 1) +
                ": " +
                set.reps +
                " reps" +
                (set.weight ? " @ " + set.weight + "kg" : "") +
                "\n";
            });
          });
      });
    r +=
      "\n=== END ===\nAnalyse: 1.Body recomp 2.Strength progress 3.Nutrition consistency 4.Next week recommendations";
    return r;
  }
  function copy() {
    navigator.clipboard
      .writeText(buildReport())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {});
  }
  const active = weeklyData.filter((d) => d.kcal > 0);
  const avgK = active.length
    ? Math.round(active.reduce((s, d) => s + d.kcal, 0) / active.length)
    : 0;
  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    const w = new Date();
    w.setDate(w.getDate() - 7);
    return d >= w;
  }).length;
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 20,
        padding: "18px",
        marginBottom: 10,
        border: `1px solid ${T.border}`,
      }}
    >
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        {" "}
        <div>
          <Lbl color={T.accent} style={{ marginBottom: 6 }}>
            WEEKLY ANALYSIS
          </Lbl>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            Copy → paste to Claude
          </div>
        </div>{" "}
        <button
          type="button"
          onClick={copy}
          style={{
            padding: "10px 16px",
            background: copied ? T.success : T.accent,
            color: "#000",
            border: "none",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {" "}
          {copied ? "✅ Copied" : "📋 Copy"}{" "}
        </button>{" "}
      </div>{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
        }}
      >
        {" "}
        {[
          ["Sessions", weekSessions + " this wk", T.accent],
          ["Avg Kcal", avgK ? avgK + " kcal" : "—", T.text],
          ["Tracked", active.length + "/7 days", T.textSub],
        ].map(([l, v, c]) => (
          <div
            key={l}
            style={{
              background: T.surfaceAlt,
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <div style={{ fontSize: 14, fontWeight: 700, color: c }}>
              {v}
            </div>{" "}
            <div
              style={{
                fontSize: 9,
                color: T.textMuted,
                marginTop: 2,
                fontFamily: "monospace",
              }}
            >
              {l}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
function MacroBreakdownModal({ foodLog, T, onClose }) {
  const [view, setView] = useState("protein");
  const macroTabs = [
    ["protein", "Protein", "#22c55e"],
    ["carbs", "Carbs", "#4facfe"],
    ["fat", "Fat", "#f59e0b"],
    ["kcal", "Calories", T.accent],
  ];
  const sorted = [...foodLog].sort((a, b) => (b[view] || 0) - (a[view] || 0));
  const totals = foodLog.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (Number(f.kcal) || 0),
      protein: acc.protein + (Number(f.protein) || 0),
      carbs: acc.carbs + (Number(f.carbs) || 0),
      fat: acc.fat + (Number(f.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const getVal = (item) =>
    view === "kcal"
      ? Math.round(item.kcal || 0)
      : Math.round((item[view] || 0) * 10) / 10;
  const total =
    view === "kcal"
      ? Math.round(totals.kcal)
      : Math.round((totals[view] || 0) * 10) / 10;
  const unit = view === "kcal" ? "kcal" : "g";
  const activeColor = macroTabs.find((t) => t[0] === view)?.[2] || T.accent;
  const activeLabel = macroTabs.find((t) => t[0] === view)?.[1] || view;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 99999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {" "}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: T.surface,
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          maxHeight: "82vh",
          border: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <div style={{ padding: "20px 20px 12px", flexShrink: 0 }}>
          {" "}
          <div
            style={{
              width: 36,
              height: 4,
              background: T.border,
              borderRadius: 99,
              margin: "0 auto 18px",
            }}
          />{" "}
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: T.text,
              marginBottom: 4,
            }}
          >
            Today's Macro Breakdown
          </div>{" "}
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>
            {foodLog.length} items logged — tap a macro to sort
          </div>{" "}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 6,
            }}
          >
            {" "}
            {macroTabs.map(([key, label, color]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                style={{
                  padding: "10px 4px",
                  borderRadius: 10,
                  border: `1px solid ${view === key ? color : T.border}`,
                  background: view === key ? color + "22" : T.surfaceAlt,
                  color: view === key ? color : T.textMuted,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {" "}
                {label}{" "}
              </button>
            ))}{" "}
          </div>{" "}
        </div>{" "}
        <div style={{ overflowY: "auto", flex: 1, padding: "4px 20px 0" }}>
          {" "}
          {sorted.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: T.textMuted,
                fontSize: 13,
              }}
            >
              No food logged yet
            </div>
          ) : (
            sorted.map((item, i) => {
              const val = getVal(item);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={item.id || i} style={{ marginBottom: 12 }}>
                  {" "}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    {" "}
                    <span
                      style={{
                        fontSize: 13,
                        color: T.text,
                        flex: 1,
                        paddingRight: 8,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.name}
                    </span>{" "}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: activeColor,
                        flexShrink: 0,
                      }}
                    >
                      {val}
                      {unit}
                    </span>{" "}
                  </div>{" "}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {" "}
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: T.border,
                        borderRadius: 99,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: activeColor,
                          borderRadius: 99,
                          transition: "width 0.4s",
                        }}
                      />{" "}
                    </div>{" "}
                    <span
                      style={{
                        fontSize: 10,
                        color: T.textMuted,
                        width: 32,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </span>{" "}
                  </div>{" "}
                </div>
              );
            })
          )}{" "}
        </div>{" "}
        <div
          style={{
            padding: "14px 20px 36px",
            borderTop: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {" "}
            <span style={{ fontSize: 13, color: T.textSub }}>
              Total {activeLabel}
            </span>{" "}
            <span style={{ fontSize: 18, fontWeight: 900, color: activeColor }}>
              {total}
              {unit}
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
function HomeTab({
  totals,
  foodLog,
  suppLog,
  weightLog,
  weeklyData,
  sessions,
  onExport,
  waterLog,
  onLogWater,
  T,
}) {
  const [showMacroDetail, setShowMacroDetail] = useState(false);
  const hr = new Date().getHours(),
    greeting =
      hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const latest = weightLog.length
    ? weightLog[weightLog.length - 1].weight
    : null;
  const change = latest ? (latest - 67).toFixed(1) : null;
  const remaining = Math.max(Math.round(TARGETS.kcal - totals.kcal), 0);
  const weekTrainCount = sessions.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    const w = new Date();
    w.setDate(w.getDate() - 7);
    return d >= w;
  }).length;
  const weekAvgKcal = weeklyData.filter((d) => d.kcal > 0).length
    ? Math.round(
        weeklyData.reduce((s, d) => s + d.kcal, 0) /
          weeklyData.filter((d) => d.kcal > 0).length,
      )
    : 0;
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <div
        style={{
          padding: "52px 20px 28px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 10 }}>
          MY FITNESS HUB
        </Lbl>{" "}
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: T.text,
            marginBottom: 4,
            letterSpacing: -0.5,
          }}
        >
          {greeting}{" "}
        </div>{" "}
        <div style={{ fontSize: 13, color: T.textSub }}>{dateStr}</div>{" "}
      </div>{" "}
      <div style={{ padding: "16px 16px 0" }}>
        {" "}
        {/* Calorie card */}{" "}
        <div
          style={{
            background: T.surface,
            borderRadius: 24,
            padding: "22px",
            marginBottom: 10,
            border: `1px solid ${T.border}`,
          }}
        >
          {" "}
          {showMacroDetail && (
            <MacroBreakdownModal
              foodLog={foodLog}
              T={T}
              onClose={() => setShowMacroDetail(false)}
            />
          )}{" "}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {" "}
            <div
              onClick={() => setShowMacroDetail(true)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {" "}
              <Ring
                value={totals.kcal}
                max={TARGETS.kcal}
                color={T.accent}
                size={96}
                stroke={8}
              >
                {" "}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: T.text,
                    lineHeight: 1,
                  }}
                >
                  {Math.round(totals.kcal)}
                </div>{" "}
                <div
                  style={{
                    fontSize: 9,
                    color: T.textSub,
                    marginTop: 2,
                    fontFamily: "monospace",
                  }}
                >
                  KCAL
                </div>{" "}
                <div
                  style={{
                    fontSize: 7,
                    color: T.textMuted,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                  }}
                >
                  TAP ▸
                </div>{" "}
              </Ring>{" "}
            </div>{" "}
            <div style={{ flex: 1 }}>
              {" "}
              <MacroRow
                label="Protein"
                value={totals.protein}
                target={TARGETS.protein}
                color="#22c55e"
              />{" "}
              <MacroRow
                label="Carbs"
                value={totals.carbs}
                target={TARGETS.carbs}
                color="#4facfe"
              />{" "}
              <MacroRow
                label="Fat"
                value={totals.fat}
                target={TARGETS.fat}
                color="#f59e0b"
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Stats row */}{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {" "}
          {[
            [
              "REMAINING",
              remaining + " kcal",
              remaining > 0 ? T.accent : T.success,
            ],
            ["WEIGHT", latest ? latest + "kg" : "—", T.text],
            [
              "TRAINED",
              weekTrainCount + " sessions",
              weekTrainCount > 0 ? T.success : T.textSub,
            ],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                background: T.surface,
                borderRadius: 16,
                padding: "14px 10px",
                textAlign: "center",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div
                style={{
                  fontSize: 9,
                  color: T.textMuted,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                {l}
              </div>{" "}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: c,
                  lineHeight: 1,
                }}
              >
                {v}
              </div>{" "}
              {l === "WEIGHT" && change && (
                <div
                  style={{
                    fontSize: 9,
                    color: parseFloat(change) <= 0 ? T.success : T.danger,
                    marginTop: 4,
                  }}
                >
                  {parseFloat(change) <= 0 ? "↓" : "↑"}
                  {Math.abs(change)}kg
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {(() => {
          const trainedToday = sessions.some((s) => s.date === getToday());
          const proteinPct = Math.min(totals.protein / TARGETS.protein, 1);
          const caloriePct =
            totals.kcal <= TARGETS.kcal
              ? Math.min(totals.kcal / TARGETS.kcal, 1)
              : Math.max(0, 1 - (totals.kcal - TARGETS.kcal) / 500);
          const trainingPct = trainedToday ? 1 : 0;
          const waterPct = Math.min(waterLog / 10, 1);
          const suppPct = SUPPLEMENTS.length
            ? Math.min(suppLog.length / SUPPLEMENTS.length, 1)
            : 0;
          const score = Math.round(
            ((proteinPct + caloriePct + trainingPct + waterPct + suppPct) / 5) *
              100,
          );
          const items = [
            [
              "Protein",
              proteinPct >= 1,
              Math.round(totals.protein) + "g",
              Math.round(proteinPct * 100) + "%",
            ],
            [
              "Calories",
              caloriePct >= 0.9,
              Math.round(totals.kcal) + " kcal",
              Math.round(caloriePct * 100) + "%",
            ],
            [
              "Training",
              trainedToday,
              trainedToday ? "done" : "pending",
              trainedToday ? "100%" : "0%",
            ],
            [
              "Water",
              waterPct >= 1,
              waterLog * 250 + "ml",
              Math.round(waterPct * 100) + "%",
            ],
            [
              "Supps",
              suppPct >= 1,
              suppLog.length + "/" + SUPPLEMENTS.length,
              Math.round(suppPct * 100) + "%",
            ],
          ];
          return (
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {" "}
                <div>
                  <Lbl color={T.accent} style={{ marginBottom: 6 }}>
                    ADHERENCE SCORE
                  </Lbl>
                  <div style={{ fontSize: 13, color: T.textSub }}>
                    Shredded physique habits today
                  </div>
                </div>{" "}
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color:
                      score >= 80
                        ? T.success
                        : score >= 60
                          ? T.warning
                          : T.danger,
                  }}
                >
                  {score}%
                </div>{" "}
              </div>{" "}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
                  gap: 6,
                }}
              >
                {" "}
                {items.map(([label, hit, val, pct]) => (
                  <div
                    key={label}
                    style={{
                      background: hit ? T.accentDim : T.surfaceAlt,
                      border: `1px solid ${hit ? T.accentMid : T.border}`,
                      borderRadius: 12,
                      padding: "9px 4px",
                      textAlign: "center",
                    }}
                  >
                    {" "}
                    <div style={{ fontSize: 16, marginBottom: 3 }}>
                      {hit ? "✅" : "○"}
                    </div>{" "}
                    <div
                      style={{
                        fontSize: 9,
                        color: hit ? T.accent : T.textMuted,
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {label.toUpperCase()}
                    </div>{" "}
                    <div
                      style={{
                        fontSize: 9,
                        color: T.textSub,
                        marginTop: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {val}
                    </div>{" "}
                    <div
                      style={{
                        fontSize: 8,
                        color: hit ? T.accent : T.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {pct}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>
          );
        })()}{" "}
        <WeeklyAnalysisCard sessions={sessions} weeklyData={weeklyData} T={T} />{" "}
        {/* 7-day calories */}{" "}
        {weeklyData.length > 0 && (
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              padding: "18px",
              marginBottom: 10,
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <Lbl color={T.accent} style={{ marginBottom: 6 }}>
              7-DAY CALORIES
            </Lbl>{" "}
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>
              Avg {weekAvgKcal} kcal · Target {TARGETS.kcal}
            </div>{" "}
            <ResponsiveContainer width="100%" height={120}>
              {" "}
              <BarChart
                data={weeklyData}
                margin={{ top: 0, right: 0, left: -28, bottom: 0 }}
              >
                {" "}
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10, fill: T.textMuted }}
                />{" "}
                <YAxis
                  tick={{ fontSize: 9, fill: T.textMuted }}
                  domain={[0, Math.max(TARGETS.kcal * 1.2, 500)]}
                />{" "}
                <Tooltip
                  contentStyle={{
                    background: T.surfaceAlt,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    fontSize: 11,
                    color: T.text,
                  }}
                  formatter={(v) => [v + " kcal", "Calories"]}
                />{" "}
                <ReferenceLine
                  y={TARGETS.kcal}
                  stroke={T.accent + "60"}
                  strokeDasharray="4 4"
                />{" "}
                <Bar
                  dataKey="kcal"
                  fill={T.accent}
                  radius={[5, 5, 0, 0]}
                  opacity={0.9}
                />{" "}
              </BarChart>{" "}
            </ResponsiveContainer>{" "}
          </div>
        )}{" "}
        {/* 7-day protein */}{" "}
        {weeklyData.length > 0 && (
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              padding: "18px",
              marginBottom: 10,
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <Lbl color={T.accent} style={{ marginBottom: 6 }}>
              7-DAY PROTEIN
            </Lbl>{" "}
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 14 }}>
              Target {TARGETS.protein}g/day
            </div>{" "}
            <ResponsiveContainer width="100%" height={100}>
              {" "}
              <BarChart
                data={weeklyData}
                margin={{ top: 0, right: 0, left: -28, bottom: 0 }}
              >
                {" "}
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10, fill: T.textMuted }}
                />{" "}
                <YAxis
                  tick={{ fontSize: 9, fill: T.textMuted }}
                  domain={[0, 180]}
                />{" "}
                <Tooltip
                  contentStyle={{
                    background: T.surfaceAlt,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    fontSize: 11,
                    color: T.text,
                  }}
                  formatter={(v) => [v + "g", "Protein"]}
                />{" "}
                <ReferenceLine
                  y={TARGETS.protein}
                  stroke="#22c55e60"
                  strokeDasharray="4 4"
                />{" "}
                <Bar
                  dataKey="protein"
                  fill="#22c55e"
                  radius={[5, 5, 0, 0]}
                  opacity={0.9}
                />{" "}
              </BarChart>{" "}
            </ResponsiveContainer>{" "}
          </div>
        )}{" "}
        {/* Supplements */}{" "}
        <div
          style={{
            background: T.surface,
            borderRadius: 20,
            padding: "18px",
            marginBottom: 10,
            border: `1px solid ${T.border}`,
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {" "}
            <Lbl color={T.accent}>SUPPLEMENTS</Lbl>{" "}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  suppLog.length === SUPPLEMENTS.length ? T.success : T.textSub,
              }}
            >
              {suppLog.length}/{SUPPLEMENTS.length}
            </div>{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {" "}
            {SUPPLEMENTS.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: suppLog.includes(s.id)
                    ? s.color + "20"
                    : "#1e1e1e",
                  border: `1px solid ${suppLog.includes(s.id) ? s.color + "50" : T.border}`,
                  fontSize: 12,
                  color: suppLog.includes(s.id) ? s.color : T.textMuted,
                  fontWeight: 600,
                }}
              >
                {" "}
                {suppLog.includes(s.id) ? "✓ " : ""}
                {s.label.split(" ")[0]}{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>{" "}
        {/* Water */}{" "}
        <div
          style={{
            background: T.surface,
            borderRadius: 20,
            padding: "18px",
            marginBottom: 10,
            border: `1px solid ${T.border}`,
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {" "}
            <Lbl color={T.accent}>WATER</Lbl>{" "}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: waterLog >= 10 ? T.success : "#4facfe",
              }}
            >
              {waterLog * 250}ml / 2500ml
            </div>{" "}
          </div>{" "}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {" "}
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onLogWater(waterLog === i + 1 ? i : i + 1)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: `1px solid ${i < waterLog ? "#4facfe50" : T.border}`,
                  background: i < waterLog ? "#4facfe20" : T.surfaceAlt,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: i < waterLog ? "#4facfe" : T.textMuted,
                }}
              >
                {" "}
                {i < waterLog ? "💧" : "○"}{" "}
              </button>
            ))}{" "}
          </div>{" "}
          <MiniBar value={waterLog} max={10} color="#4facfe" height={4} />{" "}
          {waterLog >= 10 && (
            <div
              style={{
                fontSize: 12,
                color: T.success,
                fontWeight: 600,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {" "}
              Daily target reached!
            </div>
          )}{" "}
        </div>{" "}
        <button
          type="button"
          onClick={onExport}
          style={{
            width: "100%",
            padding: "14px",
            background: T.surfaceAlt,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: T.textSub,
            marginBottom: 16,
          }}
        >
          {" "}
          Export Data (JSON){" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
function LogTab({
  foodLog,
  totals,
  onAdd,
  onRemove,
  myFoods,
  foodHistory,
  onSaveFood,
  onDeleteMyFood,
  meals,
  onSaveMeals,
  globalDate,
  onDateChange,
  T,
}) {
  const [subTab, setSubTab] = useState("quick"),
    [expandedMeal, setExpandedMeal] = useState(null),
    [toast, setToast] = useState(""),
    [searchQ, setSearchQ] = useState(""),
    [searchRes, setSearchRes] = useState([]),
    [manual, setManual] = useState({
      name: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
    }),
    [editingMeal, setEditingMeal] = useState(null),
    [newItem, setNewItem] = useState({
      name: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
    }),
    [qtyItem, setQtyItem] = useState(null),
    [showScan, setShowScan] = useState(false),
    [planItems, setPlanItems] = useState([]),
    [planSearch, setPlanSearch] = useState(""),
    [planSearchRes, setPlanSearchRes] = useState([]);
  const [pickerSource, setPickerSource] = useState("myfoods"),
    [pickerQ, setPickerQ] = useState("");
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }
  function openQty(
    name,
    kcal,
    protein,
    carbs,
    fat,
    defaultQty = 100,
    unit = "g",
  ) {
    setQtyItem({ name, kcal, protein, carbs, fat, defaultQty, unit });
  }
  function logItem(name, kcal, protein, carbs, fat) {
    onAdd({
      id: Date.now() + "_" + Math.random(),
      name: String(name),
      kcal: Number(kcal) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    showToast("✅ " + name + " added!");
  }
  const foodBankItems = mergeFoodBank([
    ...(myFoods || []),
    ...(foodHistory || []),
  ]);
  const pickerBase = pickerSource === "myfoods" ? myFoods || [] : foodBankItems;
  const pickerItems = pickerBase
    .filter(
      (f) =>
        !pickerQ.trim() ||
        String(f.name || "")
          .toLowerCase()
          .includes(pickerQ.toLowerCase()),
    )
    .slice(0, 30);
  function addFoodToMeal(mealId, food) {
    const clean = cleanFoodForBank(food);
    onSaveMeals(
      meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  name: clean.name,
                  kcal: clean.kcal,
                  protein: clean.protein,
                  carbs: clean.carbs,
                  fat: clean.fat,
                  defaultQty: clean.defaultQty,
                  unit: clean.unit,
                },
              ],
            }
          : m,
      ),
    );
    showToast("✅ " + clean.name + " added to meal");
  }
  function handleSearch(q) {
    setSearchQ(q);
    if (!q.trim()) {
      setSearchRes([]);
      return;
    }
    setSearchRes(
      FOOD_DB.filter((f) =>
        f.name.toLowerCase().includes(q.toLowerCase()),
      ).slice(0, 8),
    );
  }
  function submitManual() {
    if (!manual.name.trim() || !manual.kcal) return;
    logItem(manual.name, manual.kcal, manual.protein, manual.carbs, manual.fat);
    setManual({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  }
  function removeMealItem(mealId, idx) {
    onSaveMeals(
      meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.filter((_, i) => i !== idx) }
          : m,
      ),
    );
  }
  function addMealItem(mealId) {
    if (!newItem.name.trim() || !newItem.kcal) return;
    const item = {
      name: newItem.name,
      kcal: Number(newItem.kcal) || 0,
      protein: Number(newItem.protein) || 0,
      carbs: Number(newItem.carbs) || 0,
      fat: Number(newItem.fat) || 0,
    };
    onSaveMeals(
      meals.map((m) =>
        m.id === mealId ? { ...m, items: [...m.items, item] } : m,
      ),
    );
    setNewItem({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
    showToast("✅ Item added!");
  }
  function resetMeal(mealId) {
    const def = DEFAULT_MEALS.find((m) => m.id === mealId);
    if (!def) return;
    onSaveMeals(
      meals.map((m) => (m.id === mealId ? { ...m, items: [...def.items] } : m)),
    );
    showToast("✅ Reset to default");
  }
  const tabs = [
    ["quick", "⚡ MEALS"],
    ["log", "📋 LOG (" + foodLog.length + ")"],
    ["plan", "📅 PLAN"],
    ["myfoods", "⭐ MY FOODS (" + myFoods.length + ")"],
    ["history", "🕘 HISTORY (" + (foodHistory || []).length + ")"],
    ["search", "🔍 SEARCH"],
    ["manual", "✏️ MANUAL"],
  ];
  const cleanLoggedName = (name) =>
    String(name || "")
      .replace(/\s*\([^)]*\)\s*$/, " ")
      .trim()
      .toLowerCase();
  const isFoodLogged = (name) => {
    const target = cleanLoggedName(name);
    if (!target) return false;
    return foodLog.some((item) => {
      const logged = cleanLoggedName(item.name);
      return (
        logged === target ||
        logged.startsWith(target) ||
        target.startsWith(logged)
      );
    });
  };
  const isMealLogged = (meal) =>
    foodLog.some(
      (item) => cleanLoggedName(item.name) === cleanLoggedName(meal.label),
    );
  const addedCardStyle = {
    background: T.accentDim,
    border: `1px solid ${T.accent}`,
    boxShadow: `0 0 0 1px ${T.accentMid}, 0 0 18px ${T.accentDim}`,
  };
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <Toast msg={toast} />{" "}
      {qtyItem && (
        <QuantityModal
          item={qtyItem}
          onConfirm={(item) => {
            onAdd({ id: Date.now() + "_" + Math.random(), ...item });
            showToast("✅ " + item.name + " added!");
            setQtyItem(null);
          }}
          onClose={() => setQtyItem(null)}
          T={T}
        />
      )}{" "}
      {showScan && (
        <NutritionScanModal
          onConfirm={(food) => {
            onSaveFood(food);
            setShowScan(false);
            showToast("⭐ " + food.name + " saved!");
          }}
          onClose={() => setShowScan(false)}
          T={T}
        />
      )}{" "}
      <div
        style={{
          padding: "52px 20px 20px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 8 }}>
          FOOD LOG
        </Lbl>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
          }}
        >
          {" "}
          {[
            ["Kcal", Math.round(totals.kcal), T.accent],
            ["Protein", Math.round(totals.protein) + "g", "#22c55e"],
            ["Carbs", Math.round(totals.carbs) + "g", "#4facfe"],
            ["Fat", Math.round(totals.fat) + "g", "#f59e0b"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: T.surface,
                borderRadius: 14,
                padding: "12px 4px",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div style={{ fontSize: 18, fontWeight: 800, color: c }}>
                {v}
              </div>{" "}
              <div
                style={{
                  fontSize: 9,
                  color: T.textMuted,
                  marginTop: 2,
                  fontFamily: "monospace",
                }}
              >
                {l}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <DateNav date={globalDate} onChange={onDateChange} T={T} />{" "}
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} T={T} />{" "}
      <div style={{ padding: "14px 14px 0" }}>
        {" "}
        {/* MEALS */}{" "}
        {subTab === "quick" &&
          meals.map((meal) => {
            const tot = mealTotal(meal),
              isEditing = editingMeal === meal.id,
              mealLogged = isMealLogged(meal);
            return (
              <div
                key={meal.id}
                style={{
                  background: mealLogged ? "#0c2a0c" : T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  marginBottom: 10,
                  border: `1px solid ${mealLogged ? "#22c55e" : T.border}`,
                  boxShadow: mealLogged
                    ? "0 0 0 2px #22c55e40, 0 4px 24px #22c55e18"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  {" "}
                  <div>
                    {" "}
                    <div
                      style={{
                        fontSize: 11,
                        color: T.textMuted,
                        marginBottom: 3,
                      }}
                    >
                      {meal.time}
                    </div>{" "}
                    <div
                      style={{ fontSize: 17, fontWeight: 700, color: T.text }}
                    >
                      {meal.emoji} {meal.label}
                    </div>{" "}
                    <div
                      style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}
                    >
                      {Math.round(tot.kcal)} kcal · {Math.round(tot.protein)}g
                      protein
                    </div>{" "}
                    {mealLogged && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 8,
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: T.accent,
                          color: "#000",
                          fontSize: 10,
                          fontWeight: 900,
                          fontFamily: "monospace",
                          letterSpacing: 1,
                        }}
                      >
                        ✓ ADDED
                      </div>
                    )}{" "}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 8 }}>
                    {" "}
                    <button
                      type="button"
                      onClick={() => setEditingMeal(isEditing ? null : meal.id)}
                      style={{
                        padding: "8px 14px",
                        background: isEditing ? T.accent : T.surfaceAlt,
                        color: isEditing ? "#000" : T.textSub,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {" "}
                      {isEditing ? "Done" : "✏️"}{" "}
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        logItem(
                          meal.label,
                          tot.kcal,
                          tot.protein,
                          tot.carbs,
                          tot.fat,
                        )
                      }
                      style={{
                        padding: "8px 16px",
                        background: mealLogged ? T.success : T.accent,
                        color: "#000",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        minHeight: 40,
                      }}
                    >
                      {mealLogged ? "✓ Added" : "+All"}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                {isEditing && (
                  <div
                    style={{
                      background: T.surfaceAlt,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.accent,
                        marginBottom: 10,
                      }}
                    >
                      Editing {meal.label}
                    </div>{" "}
                    {meal.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                          background: T.surface,
                          borderRadius: 10,
                          padding: "10px 12px",
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        {" "}
                        <div style={{ flex: 1 }}>
                          {" "}
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: T.text,
                            }}
                          >
                            {item.name}
                          </div>{" "}
                          <div
                            style={{
                              fontSize: 10,
                              color: T.textSub,
                              marginTop: 2,
                            }}
                          >
                            {item.kcal} kcal · {item.protein}g P
                          </div>{" "}
                        </div>{" "}
                        <button
                          type="button"
                          onClick={() => removeMealItem(meal.id, idx)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#ff4d4d20",
                            color: T.danger,
                            border: `1px solid #ff4d4d30`,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          ✕
                        </button>{" "}
                      </div>
                    ))}{" "}
                    {myFoods.length > 0 && (
                      <div style={{ marginTop: 12, marginBottom: 12 }}>
                        {" "}
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#f59e0b",
                            marginBottom: 8,
                          }}
                        >
                          ⭐ Add from My Foods
                        </div>{" "}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            maxHeight: 180,
                            overflowY: "auto",
                          }}
                        >
                          {" "}
                          {myFoods.map((food, fi) => (
                            <button
                              key={fi}
                              type="button"
                              onClick={() => {
                                onSaveMeals(
                                  meals.map((m) =>
                                    m.id === meal.id
                                      ? {
                                          ...m,
                                          items: [
                                            ...m.items,
                                            {
                                              name: food.name,
                                              kcal: food.kcal,
                                              protein: food.protein,
                                              carbs: food.carbs,
                                              fat: food.fat,
                                            },
                                          ],
                                        }
                                      : m,
                                  ),
                                );
                                showToast("✅ " + food.name + " added!");
                              }}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 12px",
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 10,
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              {" "}
                              <div>
                                {" "}
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: T.text,
                                  }}
                                >
                                  {food.name}
                                </div>{" "}
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: T.textSub,
                                    marginTop: 2,
                                  }}
                                >
                                  {food.kcal} kcal · {food.protein}g P
                                </div>{" "}
                              </div>{" "}
                              <div
                                style={{
                                  fontSize: 18,
                                  color: "#f59e0b",
                                  flexShrink: 0,
                                }}
                              >
                                +
                              </div>{" "}
                            </button>
                          ))}{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#4facfe",
                        marginBottom: 8,
                      }}
                    >
                      + Add custom item
                    </div>{" "}
                    <input
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Item name *"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        fontSize: 13,
                        fontFamily: "inherit",
                        outline: "none",
                        background: T.surface,
                        color: T.text,
                        marginBottom: 8,
                        boxSizing: "border-box",
                      }}
                    />{" "}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {" "}
                      {[
                        ["kcal", "Kcal *", T.accent],
                        ["protein", "Protein", "#22c55e"],
                        ["carbs", "Carbs", "#4facfe"],
                        ["fat", "Fat", "#f59e0b"],
                      ].map(([k, l, c]) => (
                        <div key={k}>
                          {" "}
                          <div
                            style={{
                              fontSize: 9,
                              color: c,
                              marginBottom: 3,
                              fontFamily: "monospace",
                              fontWeight: 700,
                              letterSpacing: 1,
                            }}
                          >
                            {l.toUpperCase()}
                          </div>{" "}
                          <input
                            type="number"
                            value={newItem[k]}
                            onChange={(e) =>
                              setNewItem((p) => ({ ...p, [k]: e.target.value }))
                            }
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "9px",
                              borderRadius: 8,
                              border: `1px solid ${T.border}`,
                              fontSize: 14,
                              fontFamily: "inherit",
                              outline: "none",
                              background: T.surface,
                              color: T.text,
                              boxSizing: "border-box",
                            }}
                          />{" "}
                        </div>
                      ))}{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      {" "}
                      <button
                        type="button"
                        onClick={() => addMealItem(meal.id)}
                        style={{
                          padding: "10px",
                          background: T.accent,
                          color: "#000",
                          border: "none",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        + Add Item
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => resetMeal(meal.id)}
                        style={{
                          padding: "10px",
                          background: "#ff4d4d15",
                          color: T.danger,
                          border: `1px solid #ff4d4d30`,
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Reset
                      </button>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: T.surfaceAlt,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 12,
                      color: T.textSub,
                      fontWeight: 600,
                    }}
                  >
                    {" "}
                    {expandedMeal === meal.id
                      ? "▲ Hide"
                      : "▼ Add individual items"}{" "}
                  </button>
                )}{" "}
                {!isEditing && expandedMeal === meal.id && (
                  <div style={{ marginTop: 10 }}>
                    {" "}
                    <div
                      style={{
                        background: T.surfaceAlt,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 10,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        {" "}
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: T.accent,
                            fontFamily: "monospace",
                            letterSpacing: 1,
                          }}
                        >
                          ADD FROM BANK
                        </div>{" "}
                        <div style={{ display: "flex", gap: 6 }}>
                          {" "}
                          {[
                            ["myfoods", "My Foods"],
                            ["history", "History"],
                          ].map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setPickerSource(key)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 99,
                                border: `1px solid ${pickerSource === key ? T.accent : T.border}`,
                                background:
                                  pickerSource === key
                                    ? T.accentDim
                                    : T.surface,
                                color:
                                  pickerSource === key ? T.accent : T.textSub,
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {label}
                            </button>
                          ))}{" "}
                        </div>{" "}
                      </div>{" "}
                      <input
                        value={pickerQ}
                        onChange={(e) => setPickerQ(e.target.value)}
                        placeholder="Search saved / previous foods..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${T.border}`,
                          fontSize: 12,
                          fontFamily: "inherit",
                          outline: "none",
                          background: T.surface,
                          color: T.text,
                          boxSizing: "border-box",
                          marginBottom: 8,
                        }}
                      />{" "}
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          overflowX: "auto",
                          paddingBottom: 2,
                        }}
                      >
                        {" "}
                        {pickerItems.length === 0 ? (
                          <div
                            style={{
                              fontSize: 11,
                              color: T.textMuted,
                              padding: "8px 2px",
                            }}
                          >
                            No foods found yet
                          </div>
                        ) : (
                          pickerItems.map((food, fi) => (
                            <button
                              key={fi}
                              type="button"
                              onClick={() => addFoodToMeal(meal.id, food)}
                              style={{
                                flexShrink: 0,
                                minWidth: 170,
                                textAlign: "left",
                                padding: "10px 12px",
                                background: T.surface,
                                border: `1px solid ${T.border}`,
                                borderRadius: 12,
                                cursor: "pointer",
                              }}
                            >
                              {" "}
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: T.text,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {food.name}
                              </div>{" "}
                              <div
                                style={{
                                  fontSize: 10,
                                  color: T.textSub,
                                  marginTop: 3,
                                }}
                              >
                                {Math.round(food.kcal || 0)} kcal ·{" "}
                                {Math.round(food.protein || 0)}g P
                              </div>{" "}
                            </button>
                          ))
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                    {meal.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: isFoodLogged(item.name)
                            ? "#0c2a0c"
                            : T.surfaceAlt,
                          borderRadius: 12,
                          padding: "12px",
                          marginBottom: 8,
                          border: `1px solid ${isFoodLogged(item.name) ? "#22c55e" : T.border}`,
                          boxShadow: isFoodLogged(item.name)
                            ? "0 2px 12px #22c55e20"
                            : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {" "}
                        <div style={{ flex: 1 }}>
                          {" "}
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: T.text,
                              marginBottom: 6,
                            }}
                          >
                            {item.name}
                          </div>{" "}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4,1fr)",
                              gap: 4,
                            }}
                          >
                            {" "}
                            {[
                              ["Kcal", item.kcal, T.accent],
                              ["P", item.protein + "g", "#22c55e"],
                              ["C", item.carbs + "g", "#4facfe"],
                              ["F", item.fat + "g", "#f59e0b"],
                            ].map(([l, v, c]) => (
                              <div
                                key={l}
                                style={{
                                  textAlign: "center",
                                  background: T.surface,
                                  borderRadius: 7,
                                  padding: "4px 2px",
                                  border: `1px solid ${T.border}`,
                                }}
                              >
                                {" "}
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: c,
                                  }}
                                >
                                  {typeof v === "number" ? Math.round(v) : v}
                                </div>{" "}
                                <div
                                  style={{ fontSize: 9, color: T.textMuted }}
                                >
                                  {l}
                                </div>{" "}
                              </div>
                            ))}{" "}
                          </div>{" "}
                        </div>{" "}
                        <button
                          type="button"
                          onClick={() =>
                            openQty(
                              item.name,
                              item.kcal,
                              item.protein,
                              item.carbs,
                              item.fat,
                              item.defaultQty || 100,
                              item.unit || "g",
                            )
                          }
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: isFoodLogged(item.name)
                              ? T.success
                              : T.accent,
                            color: "#000",
                            border: "none",
                            cursor: "pointer",
                            fontSize: isFoodLogged(item.name) ? 16 : 24,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {isFoodLogged(item.name) ? "✓" : "+"}
                        </button>{" "}
                      </div>
                    ))}{" "}
                  </div>
                )}{" "}
              </div>
            );
          })}{" "}
        {/* MY FOODS */}{" "}
        {subTab === "myfoods" && (
          <div>
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {" "}
              <div style={{ fontSize: 12, color: T.textSub }}>
                Tap + to log
              </div>{" "}
              <button
                type="button"
                onClick={() => setShowScan(true)}
                style={{
                  padding: "8px 16px",
                  background: T.accent,
                  color: "#000",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {" "}
                Scan Label
              </button>{" "}
            </div>{" "}
            {myFoods.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "40px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>{" "}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.textSub,
                    marginBottom: 6,
                  }}
                >
                  No saved foods yet
                </div>{" "}
                <div
                  style={{ fontSize: 12, color: T.textMuted, marginBottom: 18 }}
                >
                  Scan a label or add manually
                </div>{" "}
                <button
                  type="button"
                  onClick={() => setShowScan(true)}
                  style={{
                    padding: "12px 24px",
                    background: T.accent,
                    color: "#000",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {" "}
                  Scan Label
                </button>{" "}
              </div>
            ) : (
              myFoods.map((food, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: isFoodLogged(food.name) ? "#0c2a0c" : T.surface,
                    borderRadius: 16,
                    padding: "14px 16px",
                    marginBottom: 8,
                    border: `1px solid ${isFoodLogged(food.name) ? "#22c55e" : T.border}`,
                    boxShadow: isFoodLogged(food.name)
                      ? "0 2px 12px #22c55e20"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: T.text,
                        marginBottom: 4,
                      }}
                    >
                      {food.name}
                    </div>{" "}
                    <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                      {" "}
                      <span style={{ color: T.accent, fontWeight: 700 }}>
                        {food.kcal} kcal
                      </span>{" "}
                      <span style={{ color: "#22c55e" }}>
                        {food.protein}g P
                      </span>{" "}
                      <span style={{ color: "#4facfe" }}>{food.carbs}g C</span>{" "}
                      <span style={{ color: "#f59e0b" }}>
                        {food.fat}g F
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  <button
                    type="button"
                    onClick={() => onDeleteMyFood(food.name)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#ff4d4d15",
                      color: T.danger,
                      border: `1px solid #ff4d4d30`,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ✕
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() =>
                      openQty(
                        food.name,
                        food.kcal,
                        food.protein,
                        food.carbs,
                        food.fat,
                        food.defaultQty || 100,
                        food.unit || "g",
                      )
                    }
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: isFoodLogged(food.name)
                        ? T.success
                        : T.accent,
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                      fontSize: isFoodLogged(food.name) ? 16 : 22,
                      fontWeight: 900,
                    }}
                  >
                    {isFoodLogged(food.name) ? "✓" : "+"}
                  </button>{" "}
                </div>
              ))
            )}{" "}
          </div>
        )}{" "}
        {/* FOOD HISTORY */}{" "}
        {subTab === "history" && (
          <div>
            {" "}
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>
              Previous foods saved automatically from Firebase. Tap + to log
              again.
            </div>{" "}
            <input
              value={pickerQ}
              onChange={(e) => setPickerQ(e.target.value)}
              placeholder="Search food history..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                background: T.surface,
                color: T.text,
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />{" "}
            {foodBankItems
              .filter(
                (f) =>
                  !pickerQ.trim() ||
                  String(f.name || "")
                    .toLowerCase()
                    .includes(pickerQ.toLowerCase()),
              )
              .slice(0, 80)
              .map((food, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: T.surface,
                    borderRadius: 14,
                    padding: "13px",
                    marginBottom: 8,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: T.text }}
                    >
                      {food.name}
                    </div>{" "}
                    <div
                      style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}
                    >
                      {Math.round(food.kcal || 0)} kcal ·{" "}
                      {Math.round(food.protein || 0)}g protein ·{" "}
                      {Math.round(food.carbs || 0)}g carbs ·{" "}
                      {Math.round(food.fat || 0)}g fat
                    </div>{" "}
                  </div>{" "}
                  <button
                    type="button"
                    onClick={() =>
                      openQty(
                        food.name,
                        food.kcal,
                        food.protein,
                        food.carbs,
                        food.fat,
                        food.defaultQty || 100,
                        food.unit || "g",
                      )
                    }
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: T.accent,
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 22,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    +
                  </button>{" "}
                </div>
              ))}{" "}
          </div>
        )}{" "}
        {/* SEARCH */}{" "}
        {subTab === "search" && (
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              padding: "18px",
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <Lbl color={T.accent} style={{ marginBottom: 10 }}>
              SEARCH FOODS
            </Lbl>{" "}
            <input
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. banana, dal, paneer..."
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 14,
                border: `1px solid ${T.border}`,
                fontSize: 15,
                fontFamily: "inherit",
                outline: "none",
                background: T.surfaceAlt,
                color: T.text,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />{" "}
            {searchRes.map((food, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: isFoodLogged(food.name)
                    ? "#0c2a0c"
                    : T.surfaceAlt,
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 8,
                  border: `1px solid ${isFoodLogged(food.name) ? "#22c55e" : T.border}`,
                  boxShadow: isFoodLogged(food.name)
                    ? "0 2px 12px #22c55e20"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {" "}
                <div style={{ flex: 1 }}>
                  {" "}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                      marginBottom: 4,
                    }}
                  >
                    {food.name}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                    <span style={{ color: T.accent, fontWeight: 700 }}>
                      {food.kcal} kcal
                    </span>
                    <span style={{ color: "#22c55e" }}>{food.protein}g P</span>
                  </div>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={() =>
                    openQty(
                      food.name,
                      food.kcal,
                      food.protein,
                      food.carbs,
                      food.fat,
                      food.defaultQty || 100,
                      food.unit || "g",
                    )
                  }
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: isFoodLogged(food.name) ? T.success : T.accent,
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                    fontSize: isFoodLogged(food.name) ? 16 : 22,
                    fontWeight: 900,
                  }}
                >
                  {isFoodLogged(food.name) ? "✓" : "+"}
                </button>{" "}
              </div>
            ))}{" "}
            {searchQ && searchRes.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  color: T.textSub,
                  fontSize: 13,
                }}
              >
                No results. Try Manual.
              </div>
            )}{" "}
          </div>
        )}{" "}
        {/* PLAN */}{" "}
        {subTab === "plan" && (
          <div>
            {" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {" "}
                <div>
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 4 }}>
                    DAILY PLANNER
                  </Lbl>{" "}
                  <div style={{ fontSize: 12, color: T.textSub }}>
                    Plan your day before you eat
                  </div>{" "}
                </div>{" "}
                {planItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlanItems([]);
                      setPlanSearch("");
                      setPlanSearchRes([]);
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "#ff4d4d15",
                      color: T.danger,
                      border: "1px solid #ff4d4d30",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Clear all
                  </button>
                )}{" "}
              </div>{" "}
              {planItems.length > 0 &&
                (() => {
                  const pt = planItems.reduce(
                    (acc, f) => ({
                      kcal: acc.kcal + (Number(f.kcal) || 0),
                      protein: acc.protein + (Number(f.protein) || 0),
                      carbs: acc.carbs + (Number(f.carbs) || 0),
                      fat: acc.fat + (Number(f.fat) || 0),
                    }),
                    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
                  );
                  return (
                    <div style={{ marginBottom: 14 }}>
                      {" "}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4,1fr)",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {" "}
                        {[
                          ["Kcal", Math.round(pt.kcal), TARGETS.kcal, T.accent],
                          [
                            "Protein",
                            Math.round(pt.protein) + "g",
                            TARGETS.protein + "g",
                            "#22c55e",
                          ],
                          [
                            "Carbs",
                            Math.round(pt.carbs) + "g",
                            TARGETS.carbs + "g",
                            "#4facfe",
                          ],
                          [
                            "Fat",
                            Math.round(pt.fat) + "g",
                            TARGETS.fat + "g",
                            "#f59e0b",
                          ],
                        ].map(([l, v, t, c]) => (
                          <div
                            key={l}
                            style={{
                              textAlign: "center",
                              background: T.surfaceAlt,
                              borderRadius: 12,
                              padding: "10px 4px",
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            {" "}
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: c,
                              }}
                            >
                              {v}
                            </div>{" "}
                            <div
                              style={{
                                fontSize: 8,
                                color: T.textMuted,
                                marginTop: 2,
                              }}
                            >
                              / {t}
                            </div>{" "}
                          </div>
                        ))}{" "}
                      </div>{" "}
                      <MiniBar
                        value={pt.kcal}
                        max={TARGETS.kcal}
                        color={T.accent}
                        height={4}
                      />{" "}
                    </div>
                  );
                })()}{" "}
              <input
                value={planSearch}
                onChange={(e) => {
                  setPlanSearch(e.target.value);
                  setPlanSearchRes(
                    e.target.value.trim()
                      ? FOOD_DB.filter((f) =>
                          f.name
                            .toLowerCase()
                            .includes(e.target.value.toLowerCase()),
                        ).slice(0, 6)
                      : [],
                  );
                }}
                placeholder="Search to add food to plan..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: T.surfaceAlt,
                  color: T.text,
                  marginTop: 6,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />{" "}
              {planSearchRes.map((food, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: T.surfaceAlt,
                    borderRadius: 12,
                    padding: "10px 14px",
                    marginBottom: 6,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                    >
                      {food.name}
                    </div>{" "}
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      <span style={{ color: T.accent, fontWeight: 700 }}>
                        {food.kcal} kcal
                      </span>
                      <span style={{ color: "#22c55e", marginLeft: 8 }}>
                        {food.protein}g P
                      </span>
                    </div>{" "}
                  </div>{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setPlanItems((prev) => [
                        ...prev,
                        { ...food, id: "plan_" + Date.now() + "_" + i },
                      ]);
                      setPlanSearch("");
                      setPlanSearchRes([]);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: T.accent,
                      color: "#000",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 20,
                      fontWeight: 900,
                    }}
                  >
                    +
                  </button>{" "}
                </div>
              ))}{" "}
            </div>{" "}
            {planItems.length > 0 && (
              <div>
                {" "}
                <Lbl color={T.accent} style={{ marginBottom: 10 }}>
                  PLANNED ITEMS
                </Lbl>{" "}
                {planItems.map((item, i) => (
                  <div
                    key={item.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: T.surface,
                      borderRadius: 14,
                      padding: "12px 16px",
                      marginBottom: 8,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {" "}
                    <div style={{ flex: 1 }}>
                      {" "}
                      <div
                        style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                      >
                        {item.name}
                      </div>{" "}
                      <div
                        style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}
                      >
                        {" "}
                        <span style={{ color: T.accent }}>
                          {Math.round(item.kcal)} kcal
                        </span>{" "}
                        ·{" "}
                        <span style={{ color: "#22c55e" }}>
                          {Math.round((item.protein || 0) * 10) / 10}g P
                        </span>{" "}
                        ·{" "}
                        <span style={{ color: "#4facfe" }}>
                          {Math.round((item.carbs || 0) * 10) / 10}g C
                        </span>{" "}
                        ·{" "}
                        <span style={{ color: "#f59e0b" }}>
                          {Math.round((item.fat || 0) * 10) / 10}g F
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setPlanItems((prev) => prev.filter((_, j) => j !== i))
                      }
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "#ff4d4d15",
                        color: T.danger,
                        border: "1px solid #ff4d4d30",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      ✕
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => {
                        onAdd({ id: Date.now() + "_plan_" + i, ...item });
                        showToast("✅ " + item.name + " logged!");
                      }}
                      style={{
                        padding: "8px 14px",
                        background: T.accentDim,
                        color: T.accent,
                        border: `1px solid ${T.accentMid}`,
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      Log
                    </button>{" "}
                  </div>
                ))}{" "}
                <button
                  type="button"
                  onClick={() => {
                    planItems.forEach((item, i) =>
                      onAdd({ id: Date.now() + "_planAll_" + i, ...item }),
                    );
                    showToast("✅ All " + planItems.length + " items logged!");
                    setPlanItems([]);
                  }}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: T.accent,
                    color: "#000",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 4,
                  }}
                >
                  {" "}
                  + Log All {planItems.length} Items to Today{" "}
                </button>{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {/* MANUAL */}{" "}
        {subTab === "manual" && (
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              padding: "18px",
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              {" "}
              <Lbl color={T.accent}>MANUAL ENTRY</Lbl>{" "}
              <button
                type="button"
                onClick={() => setShowScan(true)}
                style={{
                  padding: "8px 14px",
                  background: T.accent,
                  color: "#000",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {" "}
                Scan
              </button>{" "}
            </div>{" "}
            <input
              value={manual.name}
              onChange={(e) =>
                setManual((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Food name *"
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                background: T.surfaceAlt,
                color: T.text,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {" "}
              {[
                ["Calories *", "kcal", T.accent],
                ["Protein (g)", "protein", "#22c55e"],
                ["Carbs (g)", "carbs", "#4facfe"],
                ["Fat (g)", "fat", "#f59e0b"],
              ].map(([label, key, color]) => (
                <div key={key}>
                  {" "}
                  <div
                    style={{
                      fontSize: 10,
                      color,
                      marginBottom: 5,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {label.toUpperCase()}
                  </div>{" "}
                  <input
                    type="number"
                    value={manual[key]}
                    onChange={(e) =>
                      setManual((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      fontSize: 16,
                      fontFamily: "inherit",
                      outline: "none",
                      background: T.surfaceAlt,
                      color: T.text,
                      boxSizing: "border-box",
                    }}
                  />{" "}
                </div>
              ))}{" "}
            </div>{" "}
            <button
              type="button"
              onClick={submitManual}
              style={{
                width: "100%",
                padding: "15px",
                background: T.accent,
                color: "#000",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              + Add to Log
            </button>{" "}
            {manual.name && manual.kcal && (
              <button
                type="button"
                onClick={() => {
                  onSaveFood({
                    name: manual.name,
                    kcal: Number(manual.kcal) || 0,
                    protein: Number(manual.protein) || 0,
                    carbs: Number(manual.carbs) || 0,
                    fat: Number(manual.fat) || 0,
                  });
                  showToast("⭐ Saved to My Foods!");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: T.surfaceAlt,
                  color: "#f59e0b",
                  border: `1px solid #f59e0b40`,
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⭐ Save to My Foods
              </button>
            )}{" "}
          </div>
        )}{" "}
        {/* LOG */}{" "}
        {subTab === "log" && (
          <div>
            {" "}
            {foodLog.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "60px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>{" "}
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.textSub }}
                >
                  Nothing logged yet
                </div>{" "}
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
                  {globalDate === getToday()
                    ? "Today"
                    : fmtDateLong(globalDate)}
                </div>{" "}
              </div>
            ) : (
              <>
                {" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "16px 18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 10 }}>
                    TOTAL —{" "}
                    {globalDate === getToday()
                      ? "TODAY"
                      : fmtDateLong(globalDate).toUpperCase()}
                  </Lbl>{" "}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 8,
                    }}
                  >
                    {" "}
                    {[
                      ["Kcal", Math.round(totals.kcal), TARGETS.kcal, T.accent],
                      [
                        "Prot",
                        Math.round(totals.protein) + "g",
                        TARGETS.protein + "g",
                        "#22c55e",
                      ],
                      [
                        "Carb",
                        Math.round(totals.carbs) + "g",
                        TARGETS.carbs + "g",
                        "#4facfe",
                      ],
                      [
                        "Fat",
                        Math.round(totals.fat) + "g",
                        TARGETS.fat + "g",
                        "#f59e0b",
                      ],
                    ].map(([l, v, t, c]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        {" "}
                        <div
                          style={{ fontSize: 17, fontWeight: 800, color: c }}
                        >
                          {v}
                        </div>{" "}
                        <div style={{ fontSize: 9, color: T.textMuted }}>
                          / {t}
                        </div>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>{" "}
                {foodLog.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: T.surface,
                      borderRadius: 16,
                      padding: "14px 16px",
                      marginBottom: 8,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      {" "}
                      <div style={{ flex: 1 }}>
                        {" "}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: T.text,
                            marginBottom: 8,
                          }}
                        >
                          {item.name}
                        </div>{" "}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4,1fr)",
                            gap: 6,
                          }}
                        >
                          {" "}
                          {[
                            ["Kcal", Math.round(item.kcal), T.accent],
                            ["P", Math.round(item.protein) + "g", "#22c55e"],
                            ["C", Math.round(item.carbs) + "g", "#4facfe"],
                            ["F", Math.round(item.fat) + "g", "#f59e0b"],
                          ].map(([l, v, c]) => (
                            <div
                              key={l}
                              style={{
                                textAlign: "center",
                                background: T.surfaceAlt,
                                borderRadius: 8,
                                padding: "5px",
                                border: `1px solid ${T.border}`,
                              }}
                            >
                              {" "}
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: c,
                                }}
                              >
                                {v}
                              </div>{" "}
                              <div style={{ fontSize: 9, color: T.textMuted }}>
                                {l}
                              </div>{" "}
                            </div>
                          ))}{" "}
                        </div>{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#ff4d4d15",
                          color: T.danger,
                          border: `1px solid #ff4d4d30`,
                          cursor: "pointer",
                          fontSize: 15,
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        ✕
                      </button>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </>
            )}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function TrainTab({
  sessions,
  onSaveSession,
  onDeleteSession,
  weeklyData,
  globalDate,
  onDateChange,
  T,
}) {
  const [subTab, setSubTab] = useState("log"),
    [building, setBuilding] = useState(false),
    [exerciseType, setExerciseType] = useState("weights"),
    [sessionName, setSessionName] = useState(""),
    [exercises, setExercises] = useState([]),
    [customEx, setCustomEx] = useState(""),
    [expandedSession, setExpandedSession] = useState(null),
    [progressEx, setProgressEx] = useState(""),
    [toast, setToast] = useState(""),
    [saving, setSaving] = useState(false),
    [autoSaved, setAutoSaved] = useState(false),
    [cardioBlocks, setCardioBlocks] = useState([]),
    [showAddCardio, setShowAddCardio] = useState(false),
    [newCardio, setNewCardio] = useState({
      type: "Incline Walk",
      duration: "",
      distance: "",
      notes: "",
    }),
    [showNotes, setShowNotes] = useState({});
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }
  const exDb = exerciseType === "weights" ? GYM_EXERCISES : BW_EXERCISES;
  function addExercise(name) {
    if (!name.trim() || exercises.find((e) => e.name === name)) return;
    setExercises((prev) => [
      ...prev,
      { name, sets: [{ reps: "", weight: "" }], notes: "" },
    ]);
    setCustomEx("");
  }
  function addSet(i) {
    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === i ? { ...e, sets: [...e.sets, { reps: "", weight: "" }] } : e,
      ),
    );
  }
  function removeSet(i, si) {
    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === i ? { ...e, sets: e.sets.filter((_, s) => s !== si) } : e,
      ),
    );
  }
  function updateSet(i, si, field, val) {
    setExercises((prev) =>
      prev.map((e, ei) =>
        ei === i
          ? {
              ...e,
              sets: e.sets.map((s, s2) =>
                s2 === si ? { ...s, [field]: val } : s,
              ),
            }
          : e,
      ),
    );
    setAutoSaved(false);
    clearTimeout(window._ast);
    window._ast = setTimeout(() => setAutoSaved(true), 800);
  }
  function adjustReps(ei, si, delta) {
    const cur = Number(exercises[ei]?.sets[si]?.reps) || 0;
    updateSet(ei, si, "reps", String(Math.max(0, cur + delta)));
  }
  function adjustWeight(ei, si, delta) {
    const cur = Number(exercises[ei]?.sets[si]?.weight) || 0;
    updateSet(
      ei,
      si,
      "weight",
      String(Math.max(0, Math.round((cur + delta) * 4) / 4)),
    );
  }
  function updateExerciseNote(i, note) {
    setExercises((prev) =>
      prev.map((e, ei) => (ei === i ? { ...e, notes: note } : e)),
    );
  }
  function removeExercise(i) {
    setExercises((prev) => prev.filter((_, ei) => ei !== i));
  }
  function startSession() {
    setBuilding(true);
  }
  function cancelSession() {
    setBuilding(false);
    setSessionName("");
    setExercises([]);
    setCardioBlocks([]);
    setShowAddCardio(false);
    setNewCardio({
      type: "Incline Walk",
      customType: "",
      duration: "",
      distance: "",
      notes: "",
    });
    setShowNotes({});
  }
  function addCardioBlock() {
    if (!newCardio.duration) return;
    const cleanType =
      newCardio.type === "Other" && newCardio.customType?.trim()
        ? newCardio.customType.trim()
        : newCardio.type;
    setCardioBlocks((prev) => [
      ...prev,
      {
        type: "cardio",
        cardioData: {
          ...newCardio,
          type: cleanType,
          customType: newCardio.customType || "",
        },
      },
    ]);
    setNewCardio({
      type: "Incline Walk",
      customType: "",
      duration: "",
      distance: "",
      notes: "",
    });
    setShowAddCardio(false);
  }
  async function saveSession() {
    if (exercises.length === 0 && cardioBlocks.length === 0) return;
    setSaving(true);
    const id = "session_" + Date.now();
    const inferredMode = exercises.length > 0 ? exerciseType : "cardio";
    const totalVolume =
      exerciseType === "weights"
        ? exercises.reduce(
            (s, ex) =>
              s +
              ex.sets.reduce(
                (s2, st) =>
                  s2 + (Number(st.reps) || 0) * (Number(st.weight) || 0),
                0,
              ),
            0,
          )
        : 0;
    const primaryCardio =
      exercises.length === 0 && cardioBlocks.length > 0
        ? cardioBlocks[0].cardioData
        : null;
    const savedExtraBlocks =
      exercises.length === 0 ? cardioBlocks.slice(1) : cardioBlocks;
    const session = {
      id,
      date: globalDate,
      mode: inferredMode,
      sessionName:
        sessionName ||
        (inferredMode === "cardio" && primaryCardio
          ? primaryCardio.type
          : "Session"),
      exercises,
      cardioData: primaryCardio,
      totalVolume,
      extraBlocks: savedExtraBlocks,
      savedAt: new Date().toISOString(),
    };
    await onSaveSession(session);
    showToast("✅ Session saved!");
    cancelSession();
    setSaving(false);
    setSubTab("history");
  }
  function getProgressData(exName) {
    return sessions
      .filter((s) => s.exercises && s.exercises.find((e) => e.name === exName))
      .map((s) => {
        const ex = s.exercises.find((e) => e.name === exName);
        const tw = Math.max(...ex.sets.map((st) => Number(st.weight) || 0));
        const tr = ex.sets.find((st) => Number(st.weight) === tw)?.reps || 0;
        return { date: fmtDate(s.date), weight: tw, reps: Number(tr) };
      })
      .slice(-12);
  }
  const allExNames = [
    ...new Set(sessions.flatMap((s) => (s.exercises || []).map((e) => e.name))),
  ];
  function getPB(exName) {
    const data = getProgressData(exName);
    if (!data.length) return null;
    return data.reduce((b, d) => (d.weight > b.weight ? d : b), data[0]);
  }
  const tabs = [
    ["log", " LOG"],
    ["history", " HISTORY (" + sessions.length + ")"],
    ["progress", " PROGRESS"],
    ["analysis", " ANALYSIS"],
  ];
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <Toast msg={toast} />{" "}
      <div
        style={{
          padding: "52px 20px 20px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 8 }}>
          TRAINING
        </Lbl>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
          }}
        >
          {" "}
          {[
            [
              "Today",
              sessions.filter((s) => s.date === globalDate).length > 0
                ? "✅"
                : "—",
              T.accent,
            ],
            [
              "This week",
              sessions.filter((s) => {
                const d = new Date(s.date + "T00:00:00");
                const w = new Date();
                w.setDate(w.getDate() - 7);
                return d >= w;
              }).length,
              T.text,
            ],
            ["Total", sessions.length, T.textSub],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: T.surface,
                borderRadius: 14,
                padding: "14px 8px",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div style={{ fontSize: 20, fontWeight: 800, color: c }}>
                {v}
              </div>{" "}
              <div
                style={{
                  fontSize: 9,
                  color: T.textMuted,
                  marginTop: 4,
                  fontFamily: "monospace",
                }}
              >
                {l.toUpperCase()}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <DateNav date={globalDate} onChange={onDateChange} T={T} />{" "}
      <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} T={T} />{" "}
      <div style={{ padding: "14px 14px 0" }}>
        {" "}
        {/* LOG SESSION */}{" "}
        {subTab === "log" && (
          <div>
            {" "}
            {!building ? (
              <div>
                {" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "16px 18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 6 }}>
                    LOGGING FOR
                  </Lbl>{" "}
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: globalDate === getToday() ? T.accent : "#f59e0b",
                      marginBottom: 8,
                    }}
                  >
                    {globalDate === getToday()
                      ? "Today — " + fmtDate(globalDate)
                      : fmtDateLong(globalDate)}
                  </div>{" "}
                  {sessions
                    .filter((s) => s.date === globalDate)
                    .map((s) => (
                      <div
                        key={s.id}
                        style={{
                          fontSize: 12,
                          color: T.success,
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        ✅ {s.sessionName}
                      </div>
                    ))}{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={startSession}
                  style={{
                    width: "100%",
                    padding: "22px",
                    background: T.accent,
                    color: "#000",
                    border: "none",
                    borderRadius: 18,
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: 0.3,
                  }}
                >
                  {" "}
                  + Start Session{" "}
                </button>{" "}
              </div>
            ) : (
              <div>
                {" "}
                {/* Session header */}{" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "16px 18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {" "}
                    {[
                      ["️ Gym", "weights"],
                      [" Bodyweight", "bodyweight"],
                    ].map(([label, type]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExerciseType(type)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 12,
                          border: `1px solid ${exerciseType === type ? T.accent : T.border}`,
                          background:
                            exerciseType === type ? T.accentDim : T.surfaceAlt,
                          color: exerciseType === type ? T.accent : T.textSub,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {" "}
                        {label}{" "}
                      </button>
                    ))}{" "}
                    <button
                      type="button"
                      onClick={cancelSession}
                      style={{
                        padding: "10px 16px",
                        background: "#ff4d4d15",
                        color: T.danger,
                        border: "1px solid #ff4d4d30",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>{" "}
                  </div>{" "}
                  <input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder={
                      exerciseType === "weights"
                        ? "e.g. Chest & Triceps"
                        : "e.g. Upper Body"
                    }
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${T.border}`,
                      fontSize: 14,
                      fontFamily: "inherit",
                      outline: "none",
                      background: T.surfaceAlt,
                      color: T.text,
                      boxSizing: "border-box",
                    }}
                  />{" "}
                </div>{" "}
                {/* Exercise picker */}{" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                    ADD EXERCISE
                  </Lbl>{" "}
                  {Object.entries(exDb).map(([group, exList]) => (
                    <div key={group} style={{ marginBottom: 12 }}>
                      {" "}
                      <div
                        style={{
                          fontSize: 10,
                          color: T.textMuted,
                          fontFamily: "monospace",
                          letterSpacing: 2,
                          marginBottom: 8,
                        }}
                      >
                        {group.toUpperCase()}
                      </div>{" "}
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {" "}
                        {exList.map((ex) => {
                          const added = !!exercises.find((e) => e.name === ex);
                          return (
                            <button
                              key={ex}
                              type="button"
                              onClick={() => addExercise(ex)}
                              disabled={added}
                              style={{
                                padding: "7px 14px",
                                borderRadius: 99,
                                border: `1px solid ${added ? T.accent : T.border}`,
                                background: added ? T.accentDim : T.surfaceAlt,
                                color: added ? T.accent : T.textSub,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: added ? "default" : "pointer",
                              }}
                            >
                              {" "}
                              {ex} {added ? "✓" : "+"}{" "}
                            </button>
                          );
                        })}{" "}
                      </div>{" "}
                    </div>
                  ))}{" "}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {" "}
                    <input
                      value={customEx}
                      onChange={(e) => setCustomEx(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && addExercise(customEx)
                      }
                      placeholder="Custom exercise..."
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: `1px solid ${T.border}`,
                        fontSize: 13,
                        fontFamily: "inherit",
                        outline: "none",
                        background: T.surfaceAlt,
                        color: T.text,
                      }}
                    />{" "}
                    <button
                      type="button"
                      onClick={() => addExercise(customEx)}
                      style={{
                        padding: "11px 18px",
                        background: T.accent,
                        color: "#000",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Add
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Exercise cards with +/- steppers */}{" "}
                {exercises.map((ex, ei) => (
                  <div
                    key={ei}
                    style={{
                      background: T.surface,
                      borderRadius: 20,
                      padding: "18px",
                      marginBottom: 10,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: T.text,
                          flex: 1,
                        }}
                      >
                        {ex.name}
                      </div>{" "}
                      <div style={{ display: "flex", gap: 8 }}>
                        {" "}
                        <button
                          type="button"
                          onClick={() =>
                            setShowNotes((p) => ({ ...p, [ei]: !p[ei] }))
                          }
                          style={{
                            padding: "6px 12px",
                            background: showNotes[ei]
                              ? "#f59e0b20"
                              : T.surfaceAlt,
                            color: showNotes[ei] ? "#f59e0b" : T.textMuted,
                            border: `1px solid ${showNotes[ei] ? "#f59e0b50" : T.border}`,
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                          title="Add notes"
                        ></button>{" "}
                        <button
                          type="button"
                          onClick={() => removeExercise(ei)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#ff4d4d15",
                            color: T.danger,
                            border: "1px solid #ff4d4d30",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          ✕
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          exerciseType === "weights"
                            ? "36px 1fr 1fr 36px"
                            : "36px 1fr 36px",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {" "}
                      <div />{" "}
                      <div
                        style={{
                          fontSize: 10,
                          color: "#22c55e",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          textAlign: "center",
                          letterSpacing: 1,
                        }}
                      >
                        REPS
                      </div>{" "}
                      {exerciseType === "weights" && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#4facfe",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            textAlign: "center",
                            letterSpacing: 1,
                          }}
                        >
                          KG
                        </div>
                      )}{" "}
                      <div />{" "}
                    </div>{" "}
                    {ex.sets.map((set, si) => (
                      <div
                        key={si}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            exerciseType === "weights"
                              ? "36px 1fr 1fr 36px"
                              : "36px 1fr 36px",
                          gap: 6,
                          marginBottom: 8,
                          alignItems: "center",
                        }}
                      >
                        {" "}
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 13,
                            color: T.textMuted,
                            fontWeight: 700,
                            lineHeight: "56px",
                          }}
                        >
                          {si + 1}
                        </div>{" "}
                        {/* Reps stepper */}{" "}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#22c55e0d",
                            borderRadius: 14,
                            border: "1.5px solid #22c55e40",
                            overflow: "hidden",
                            height: 56,
                          }}
                        >
                          {" "}
                          <button
                            type="button"
                            onPointerDown={() => adjustReps(ei, si, -1)}
                            style={{
                              width: 40,
                              height: "100%",
                              border: "none",
                              background: "transparent",
                              color: "#22c55e",
                              fontSize: 22,
                              fontWeight: 900,
                              cursor: "pointer",
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            −
                          </button>{" "}
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(ei, si, "reps", e.target.value)
                            }
                            placeholder="0"
                            style={{
                              flex: 1,
                              height: "100%",
                              border: "none",
                              fontSize: 22,
                              fontWeight: 800,
                              textAlign: "center",
                              fontFamily: "inherit",
                              outline: "none",
                              background: "transparent",
                              color: T.text,
                              minWidth: 0,
                            }}
                          />{" "}
                          <button
                            type="button"
                            onPointerDown={() => adjustReps(ei, si, 1)}
                            style={{
                              width: 40,
                              height: "100%",
                              border: "none",
                              background: "transparent",
                              color: "#22c55e",
                              fontSize: 22,
                              fontWeight: 900,
                              cursor: "pointer",
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            +
                          </button>{" "}
                        </div>{" "}
                        {/* Weight stepper */}{" "}
                        {exerciseType === "weights" && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              background: "#4facfe0d",
                              borderRadius: 14,
                              border: "1.5px solid #4facfe40",
                              overflow: "hidden",
                              height: 56,
                            }}
                          >
                            {" "}
                            <button
                              type="button"
                              onPointerDown={() => adjustWeight(ei, si, -2.5)}
                              style={{
                                width: 40,
                                height: "100%",
                                border: "none",
                                background: "transparent",
                                color: "#4facfe",
                                fontSize: 22,
                                fontWeight: 900,
                                cursor: "pointer",
                                flexShrink: 0,
                                lineHeight: 1,
                              }}
                            >
                              −
                            </button>{" "}
                            <input
                              type="number"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) =>
                                updateSet(ei, si, "weight", e.target.value)
                              }
                              placeholder="0"
                              style={{
                                flex: 1,
                                height: "100%",
                                border: "none",
                                fontSize: 20,
                                fontWeight: 800,
                                textAlign: "center",
                                fontFamily: "inherit",
                                outline: "none",
                                background: "transparent",
                                color: T.text,
                                minWidth: 0,
                              }}
                            />{" "}
                            <button
                              type="button"
                              onPointerDown={() => adjustWeight(ei, si, 2.5)}
                              style={{
                                width: 40,
                                height: "100%",
                                border: "none",
                                background: "transparent",
                                color: "#4facfe",
                                fontSize: 22,
                                fontWeight: 900,
                                cursor: "pointer",
                                flexShrink: 0,
                                lineHeight: 1,
                              }}
                            >
                              +
                            </button>{" "}
                          </div>
                        )}{" "}
                        <button
                          type="button"
                          onClick={() => removeSet(ei, si)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#ff4d4d15",
                            color: T.danger,
                            border: "1px solid #ff4d4d30",
                            cursor: "pointer",
                            fontSize: 16,
                            alignSelf: "center",
                          }}
                        >
                          ✕
                        </button>{" "}
                      </div>
                    ))}{" "}
                    <button
                      type="button"
                      onClick={() => addSet(ei)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: T.surfaceAlt,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 13,
                        color: T.textSub,
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      + Add Set
                    </button>{" "}
                    {showNotes[ei] && (
                      <div style={{ marginTop: 12 }}>
                        {" "}
                        <div
                          style={{
                            fontSize: 10,
                            color: "#f59e0b",
                            fontFamily: "monospace",
                            letterSpacing: 1,
                            marginBottom: 6,
                          }}
                        >
                          NOTES
                        </div>{" "}
                        <textarea
                          value={ex.notes || ""}
                          onChange={(e) =>
                            updateExerciseNote(ei, e.target.value)
                          }
                          placeholder="e.g. felt strong, speed 8.5 incline 6, superset with dips, form note..."
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #f59e0b40",
                            fontSize: 12,
                            fontFamily: "inherit",
                            outline: "none",
                            background: "#f59e0b08",
                            color: T.text,
                            resize: "vertical",
                            minHeight: 60,
                            boxSizing: "border-box",
                            lineHeight: 1.6,
                          }}
                        />{" "}
                      </div>
                    )}{" "}
                  </div>
                ))}{" "}
                {/* Cardio section */}{" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 10,
                    border: "1px solid #f59e0b30",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom:
                        cardioBlocks.length > 0 || showAddCardio ? 12 : 0,
                    }}
                  >
                    {" "}
                    <Lbl color="#f59e0b">CARDIO</Lbl>{" "}
                    <button
                      type="button"
                      onClick={() => setShowAddCardio(!showAddCardio)}
                      style={{
                        padding: "8px 16px",
                        background: showAddCardio ? "#f59e0b20" : T.surfaceAlt,
                        color: "#f59e0b",
                        border: "1px solid #f59e0b40",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {" "}
                      {showAddCardio ? "✕ Cancel" : "+ Add Cardio"}{" "}
                    </button>{" "}
                  </div>{" "}
                  {cardioBlocks.map((block, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        background: "#22c55e0d",
                        borderRadius: 12,
                        padding: "12px 14px",
                        marginBottom: 8,
                        border: "1px solid #22c55e40",
                      }}
                    >
                      {" "}
                      <div>
                        {" "}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: T.success,
                          }}
                        >
                          ✅ {block.cardioData?.type}
                        </div>{" "}
                        <div
                          style={{
                            fontSize: 11,
                            color: T.textSub,
                            marginTop: 2,
                          }}
                        >
                          {block.cardioData?.duration} mins
                          {block.cardioData?.distance
                            ? " · " + block.cardioData.distance + "km"
                            : ""}
                        </div>{" "}
                        {block.cardioData?.notes && (
                          <div
                            style={{
                              fontSize: 11,
                              color: T.textMuted,
                              marginTop: 3,
                              fontStyle: "italic",
                            }}
                          >
                            {" "}
                            {block.cardioData.notes}
                          </div>
                        )}{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setCardioBlocks((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#ff4d4d15",
                          color: T.danger,
                          border: "1px solid #ff4d4d30",
                          cursor: "pointer",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>{" "}
                    </div>
                  ))}{" "}
                  {showAddCardio && (
                    <div
                      style={{
                        background: T.surfaceAlt,
                        borderRadius: 14,
                        padding: 14,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        {" "}
                        {CARDIO_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setNewCardio((p) => ({ ...p, type: t }))
                            }
                            style={{
                              padding: "7px 14px",
                              borderRadius: 99,
                              border: `1px solid ${newCardio.type === t ? "#f59e0b" : T.border}`,
                              background:
                                newCardio.type === t ? "#f59e0b20" : T.surface,
                              color:
                                newCardio.type === t ? "#f59e0b" : T.textSub,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {t}
                          </button>
                        ))}{" "}
                      </div>{" "}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {" "}
                        {[
                          ["DURATION (mins) *", "duration"],
                          ["DISTANCE (km)", "distance"],
                        ].map(([l, k]) => (
                          <div key={k}>
                            {" "}
                            <div
                              style={{
                                fontSize: 10,
                                color: T.textMuted,
                                fontFamily: "monospace",
                                marginBottom: 5,
                              }}
                            >
                              {l}
                            </div>{" "}
                            <input
                              type="number"
                              value={newCardio[k] || ""}
                              onChange={(e) =>
                                setNewCardio((p) => ({
                                  ...p,
                                  [k]: e.target.value,
                                }))
                              }
                              placeholder="0"
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: 10,
                                border: `1px solid ${T.border}`,
                                fontSize: 18,
                                fontWeight: 700,
                                textAlign: "center",
                                fontFamily: "inherit",
                                outline: "none",
                                background: T.surface,
                                color: T.text,
                                boxSizing: "border-box",
                              }}
                            />{" "}
                          </div>
                        ))}{" "}
                      </div>{" "}
                      {newCardio.duration && newCardio.distance && (
                        <div
                          style={{
                            background: "#f59e0b15",
                            borderRadius: 10,
                            padding: "8px 12px",
                            fontSize: 12,
                            color: "#f59e0b",
                            fontWeight: 700,
                            border: "1px solid #f59e0b30",
                            marginBottom: 10,
                          }}
                        >
                          ⚡ Avg pace:{" "}
                          {(
                            Number(newCardio.duration) /
                            Number(newCardio.distance)
                          ).toFixed(1)}{" "}
                          min/km
                        </div>
                      )}{" "}
                      <input
                        value={newCardio.notes || ""}
                        onChange={(e) =>
                          setNewCardio((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="Notes: speed, incline, pace, how it felt..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1px solid ${T.border}`,
                          fontSize: 12,
                          fontFamily: "inherit",
                          outline: "none",
                          background: T.surface,
                          color: T.text,
                          marginBottom: 10,
                          boxSizing: "border-box",
                        }}
                      />{" "}
                      <button
                        type="button"
                        onClick={addCardioBlock}
                        disabled={!newCardio.duration}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: newCardio.duration ? "#f59e0b" : "#333",
                          color: newCardio.duration ? "#000" : "#666",
                          border: "none",
                          borderRadius: 10,
                          cursor: newCardio.duration
                            ? "pointer"
                            : "not-allowed",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        ✅ Add Cardio Block
                      </button>{" "}
                    </div>
                  )}{" "}
                  {cardioBlocks.length === 0 && !showAddCardio && (
                    <div
                      style={{
                        fontSize: 12,
                        color: T.textMuted,
                        textAlign: "center",
                        padding: "8px 0",
                      }}
                    >
                      No cardio — tap + Add Cardio above
                    </div>
                  )}{" "}
                </div>{" "}
                {exercises.length > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: autoSaved ? T.success : T.textMuted,
                      fontFamily: "monospace",
                      marginBottom: 10,
                    }}
                  >
                    {autoSaved ? "✓ Progress recorded" : "Recording..."}
                  </div>
                )}{" "}
                <button
                  type="button"
                  onClick={saveSession}
                  disabled={
                    saving ||
                    (exercises.length === 0 && cardioBlocks.length === 0)
                  }
                  style={{
                    width: "100%",
                    padding: "18px",
                    background:
                      saving ||
                      (exercises.length === 0 && cardioBlocks.length === 0)
                        ? "#333"
                        : T.accent,
                    color:
                      saving ||
                      (exercises.length === 0 && cardioBlocks.length === 0)
                        ? "#666"
                        : "#000",
                    border: "none",
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor:
                      saving ||
                      (exercises.length === 0 && cardioBlocks.length === 0)
                        ? "not-allowed"
                        : "pointer",
                    marginBottom: 20,
                  }}
                >
                  {" "}
                  {saving ? "Saving…" : "✅ Save Session"}{" "}
                </button>{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {/* HISTORY */}{" "}
        {subTab === "history" && (
          <div>
            {" "}
            {sessions.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "60px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 14 }}>🏋️</div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.textSub }}
                >
                  No sessions yet
                </div>
              </div>
            ) : (
              [...sessions].reverse().map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "16px 18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <div
                    onClick={() =>
                      setExpandedSession(
                        expandedSession === session.id ? null : session.id,
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      {" "}
                      <div>
                        {" "}
                        <div
                          style={{
                            fontSize: 11,
                            color: T.accent,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {fmtDateLong(session.date).toUpperCase()}
                        </div>{" "}
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: T.text,
                            marginBottom: 4,
                          }}
                        >
                          {session.sessionName}
                        </div>{" "}
                        <div style={{ fontSize: 12, color: T.textSub }}>
                          {session.mode === "cardio"
                            ? `${session.cardioData?.duration} mins${session.cardioData?.distance ? " · " + session.cardioData.distance + "km" : ""}`
                            : `${session.exercises?.length} exercises${session.totalVolume > 0 ? " · " + Math.round(session.totalVolume) + "kg vol" : ""}`}
                        </div>{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#ff4d4d15",
                          color: T.danger,
                          border: "1px solid #ff4d4d30",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        ✕
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                  {expandedSession === session.id && (
                    <div
                      style={{
                        marginTop: 14,
                        borderTop: `1px solid ${T.border}`,
                        paddingTop: 14,
                      }}
                    >
                      {" "}
                      {session.mode === "cardio" ? (
                        <div
                          style={{
                            background: T.surfaceAlt,
                            borderRadius: 12,
                            padding: 12,
                            border: `1px solid ${T.border}`,
                          }}
                        >
                          {" "}
                          {[
                            ["Type", session.cardioData?.type],
                            [
                              "Duration",
                              session.cardioData?.duration + " mins",
                            ],
                            session.cardioData?.distance
                              ? ["Distance", session.cardioData.distance + "km"]
                              : null,
                            session.cardioData?.distance &&
                            session.cardioData?.duration
                              ? [
                                  "Pace",
                                  (
                                    Number(session.cardioData.duration) /
                                    Number(session.cardioData.distance)
                                  ).toFixed(1) + " min/km",
                                ]
                              : null,
                          ]
                            .filter(Boolean)
                            .map(([l, v]) => (
                              <div
                                key={l}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{ fontSize: 12, color: T.textSub }}
                                >
                                  {l}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: T.text,
                                  }}
                                >
                                  {v}
                                </span>
                              </div>
                            ))}{" "}
                        </div>
                      ) : (
                        session.exercises?.map((ex, i) => (
                          <div
                            key={i}
                            style={{
                              marginBottom: 10,
                              background: T.surfaceAlt,
                              borderRadius: 12,
                              padding: "12px 14px",
                              border: `1px solid ${T.border}`,
                            }}
                          >
                            {" "}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: T.text,
                                marginBottom: ex.notes ? 4 : 8,
                              }}
                            >
                              {ex.name}
                            </div>{" "}
                            {ex.notes && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#f59e0b",
                                  fontStyle: "italic",
                                  marginBottom: 8,
                                  lineHeight: 1.5,
                                }}
                              >
                                {" "}
                                {ex.notes}
                              </div>
                            )}{" "}
                            {ex.sets.map((set, si) => (
                              <div
                                key={si}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                {" "}
                                <span
                                  style={{ fontSize: 12, color: T.textSub }}
                                >
                                  Set {si + 1}
                                </span>{" "}
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: T.text,
                                  }}
                                >
                                  {set.reps} reps
                                  {set.weight ? " @ " + set.weight + "kg" : ""}
                                </span>{" "}
                              </div>
                            ))}{" "}
                          </div>
                        ))
                      )}{" "}
                      {session.extraBlocks?.length > 0 && (
                        <div
                          style={{
                            background: "#22c55e10",
                            borderRadius: 12,
                            padding: "10px 14px",
                            border: "1px solid #22c55e30",
                          }}
                        >
                          {" "}
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.success,
                              marginBottom: 6,
                            }}
                          >
                            + Additional blocks
                          </div>{" "}
                          {session.extraBlocks.map((b, i) => (
                            <div
                              key={i}
                              style={{ fontSize: 12, color: T.textSub }}
                            >
                              {b.cardioData?.type}: {b.cardioData?.duration}{" "}
                              mins
                              {b.cardioData?.distance
                                ? " · " + b.cardioData.distance + "km"
                                : ""}
                            </div>
                          ))}{" "}
                        </div>
                      )}{" "}
                    </div>
                  )}{" "}
                </div>
              ))
            )}{" "}
          </div>
        )}{" "}
        {/* PROGRESS */}{" "}
        {subTab === "progress" && (
          <div>
            {" "}
            {allExNames.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "60px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 14 }}>📈</div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.textSub }}
                >
                  Log weight sessions to track progress
                </div>
              </div>
            ) : (
              <div>
                {" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                    PERSONAL BESTS
                  </Lbl>{" "}
                  {allExNames.map((exName) => {
                    const pb = getPB(exName);
                    if (!pb || !pb.weight) return null;
                    return (
                      <div
                        key={exName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {" "}
                        <span style={{ fontSize: 13, color: T.textSub }}>
                          {exName}
                        </span>{" "}
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: T.accent,
                          }}
                        >
                          {pb.weight}kg × {pb.reps} reps
                        </span>{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 20,
                    padding: "18px",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                    STRENGTH GRAPH
                  </Lbl>{" "}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 16,
                    }}
                  >
                    {" "}
                    {allExNames.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setProgressEx(ex)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 99,
                          border: `1px solid ${progressEx === ex ? T.accent : T.border}`,
                          background:
                            progressEx === ex ? T.accentDim : T.surfaceAlt,
                          color: progressEx === ex ? T.accent : T.textSub,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {ex}
                      </button>
                    ))}{" "}
                  </div>{" "}
                  {progressEx && getProgressData(progressEx).length > 0 && (
                    <ResponsiveContainer width="100%" height={160}>
                      {" "}
                      <LineChart
                        data={getProgressData(progressEx)}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        {" "}
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: T.textMuted }}
                        />{" "}
                        <YAxis
                          tick={{ fontSize: 9, fill: T.textMuted }}
                          domain={["auto", "auto"]}
                          unit="kg"
                        />{" "}
                        <Tooltip
                          contentStyle={{
                            background: T.surfaceAlt,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            fontSize: 11,
                            color: T.text,
                          }}
                          formatter={(v) => [v + "kg", "Top weight"]}
                        />{" "}
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke={T.accent}
                          strokeWidth={2.5}
                          dot={{ fill: T.accent, r: 5, strokeWidth: 0 }}
                        />{" "}
                      </LineChart>{" "}
                    </ResponsiveContainer>
                  )}{" "}
                </div>{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {subTab === "analysis" && (
          <WeeklyAnalysisCard
            sessions={sessions}
            weeklyData={weeklyData}
            T={T}
          />
        )}{" "}
      </div>{" "}
    </div>
  );
}
function BodyTab({
  weightLog,
  onAdd,
  photos,
  onAddPhoto,
  onDeletePhoto,
  bodyScanLog,
  onSaveScan,
  checkins,
  onSaveCheckin,
  T,
}) {
  const [bodyTab, setBodyTab] = useState("scan"),
    [weightInput, setWeightInput] = useState(""),
    [saved, setSaved] = useState(false),
    [uploading, setUploading] = useState(false),
    [viewPhoto, setViewPhoto] = useState(null),
    [photoNote, setPhotoNote] = useState(""),
    [checkin, setCheckin] = useState({
      energy: "3",
      sleep: "",
      stress: "3",
      soreness: "3",
      steps: "",
      notes: "",
    }),
    [checkinSaved, setCheckinSaved] = useState(false);
  const today = getToday(),
    todayEntry = weightLog.find((w) => w.date === today),
    latest = weightLog.length ? weightLog[weightLog.length - 1].weight : null,
    change = latest ? (latest - 67).toFixed(1) : null,
    bmi = latest ? (latest / (1.68 * 1.68)).toFixed(1) : null;
  const chartData = weightLog
    .slice(-30)
    .map((w) => ({ date: fmtDate(w.date), weight: parseFloat(w.weight) }));
  const baseline = {
    weight: 66.2,
    bodyFat: 22.7,
    muscleRate: 46.3,
    bmi: 23.5,
    bmr: 1394,
    visceralFat: 8,
  };
  async function handleSave() {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 30 || w > 300) return;
    await onAdd({ date: today, weight: w });
    setSaved(true);
    setWeightInput("");
    setTimeout(() => setSaved(false), 2000);
  }
  async function handleSaveCheckin() {
    await onSaveCheckin({
      date: today,
      ...checkin,
      savedAt: new Date().toISOString(),
    });
    setCheckinSaved(true);
    setTimeout(() => setCheckinSaved(false), 2500);
  }
  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compress(file);
      await onAddPhoto({
        id: String(Date.now()),
        date: today,
        dataUrl,
        note: photoNote.trim(),
      });
      setPhotoNote("");
    } catch (err) {
      alert("Photo failed: " + (err.message || "Unknown"));
    }
    e.target.value = "";
    setUploading(false);
  }
  const [scanning, setScanning] = useState(false),
    [scanResult, setScanResult] = useState(null),
    [scanError, setScanError] = useState(""),
    [scanProgress, setScanProgress] = useState(""),
    [scanSaved, setScanSaved] = useState(false),
    [tReady, setTReady] = useState(!!window.Tesseract);
  useEffect(() => {
    if (window.Tesseract) {
      setTReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
    s.onload = () => setTReady(true);
    document.head.appendChild(s);
  }, []);
  const METRIC_KEYS = [
    "weight",
    "bodyFat",
    "bmi",
    "muscleRate",
    "bodyWater",
    "boneMass",
    "proteinRate",
    "bmr",
    "visceralFat",
  ];
  const RANGES = {
    weight: [40, 150],
    bodyFat: [5, 50],
    bmi: [15, 40],
    muscleRate: [25, 70],
    bodyWater: [40, 80],
    boneMass: [1, 5],
    proteinRate: [10, 30],
    bmr: [1000, 2500],
    visceralFat: [1, 30],
  };
  function fitRange(raw, key) {
    if (raw === null || isNaN(raw)) return null;
    const [lo, hi] = RANGES[key];
    for (const div of [1, 10, 100]) {
      const c = raw / div;
      if (c >= lo && c <= hi) return Math.round(c * 10) / 10;
    }
    return null;
  }
  async function readZoneNum(canvas, x1, y1, w, h, psm = 8) {
    const scale = 5,
      zc = document.createElement("canvas");
    zc.width = w * scale + 80;
    zc.height = h * scale + 80;
    const zx = zc.getContext("2d");
    zx.fillStyle = "white";
    zx.fillRect(0, 0, zc.width, zc.height);
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    tmp
      .getContext("2d")
      .putImageData(canvas.getContext("2d").getImageData(x1, y1, w, h), 0, 0);
    const id = tmp.getContext("2d").getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < 130 && d[i + 1] > 100 && d[i + 2] > 170) {
        d[i] = d[i + 1] = d[i + 2] = 0;
      } else {
        d[i] = d[i + 1] = d[i + 2] = 255;
      }
      d[i + 3] = 255;
    }
    tmp.getContext("2d").putImageData(id, 0, 0);
    zx.drawImage(tmp, 40, 40, w * scale, h * scale);
    try {
      const r = await window.Tesseract.recognize(zc, "eng", {
        tessedit_char_whitelist: "0123456789.",
        tessedit_pageseg_mode: String(psm),
      });
      const t = r.data.text.trim();
      const m = t.match(/\d+\.?\d*/);
      return m ? parseFloat(m[0]) : null;
    } catch {
      return null;
    }
  }
  async function analyseScan(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    if (!tReady || !window.Tesseract) {
      setScanError("OCR still loading.");
      return;
    }
    setScanning(true);
    setScanResult(null);
    setScanError("");
    setScanSaved(false);
    try {
      setScanProgress("Loading image...");
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(file);
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const W = img.width,
        H = img.height;
      const full = canvas.getContext("2d").getImageData(0, 0, W, H).data;
      function rowWhite(y) {
        let w = 0;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (full[i] > 230 && full[i + 1] > 230 && full[i + 2] > 230) w++;
        }
        return w / W;
      }
      const bands = [];
      let inB = false,
        bS = 0;
      for (let y = 0; y < H; y++) {
        const iW = rowWhite(y) > 0.5;
        if (iW && !inB) {
          inB = true;
          bS = y;
        } else if (!iW && inB) {
          if (y - bS > 50) bands.push([bS, y]);
          inB = false;
        }
      }
      if (inB) bands.push([bS, H]);
      const gridBands = bands.filter(([s, e]) => e - s > 100).slice(0, 3);
      if (gridBands.length < 3)
        throw new Error("Could not find all 3 grid rows.");
      const results = {};
      for (let row = 0; row < 3; row++) {
        const [bStart, bEnd] = gridBands[row];
        const bandH = bEnd - bStart;
        const numCY = Math.round(bStart + bandH * 0.75);
        const colW = Math.floor(W / 3);
        const half = 50;
        setScanProgress("Reading row " + (row + 1) + " of 3...");
        for (let col = 0; col < 3; col++) {
          const key = METRIC_KEYS[row * 3 + col];
          const x1 = col * colW,
            x2 = Math.min((col + 1) * colW, W);
          let raw = await readZoneNum(
            canvas,
            x1,
            numCY - half,
            x2 - x1,
            half * 2,
            8,
          );
          let val = fitRange(raw, key);
          if (val === null) {
            raw = await readZoneNum(
              canvas,
              x1,
              numCY - half,
              x2 - x1,
              half * 2,
              11,
            );
            val = fitRange(raw, key);
          }
          results[key] = val;
        }
      }
      if (!results.weight)
        throw new Error(
          "Weight not detected. Show full HF Fitness results grid.",
        );
      setScanResult({ ...results, date: today });
    } catch (err) {
      setScanError(err.message || "Could not read screenshot.");
    }
    setScanning(false);
    setScanProgress("");
  }
  async function confirmScan() {
    if (!scanResult) return;
    await onSaveScan(scanResult);
    setScanSaved(true);
    setTimeout(() => setScanSaved(false), 3000);
  }
  const latestScan = bodyScanLog.length
    ? bodyScanLog[bodyScanLog.length - 1]
    : null;
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <div
        style={{
          padding: "52px 20px 20px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 8 }}>
          BODY STATS
        </Lbl>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
          }}
        >
          {" "}
          {[
            ["Weight", latest ? latest + "kg" : "—", T.accent],
            [
              "Change",
              change
                ? `${parseFloat(change) <= 0 ? "↓" : "↑"}${Math.abs(change)}kg`
                : "—",
              change && parseFloat(change) <= 0 ? T.success : T.textSub,
            ],
            ["BMI", bmi || "—", "#4facfe"],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                textAlign: "center",
                background: T.surface,
                borderRadius: 14,
                padding: "14px 8px",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: c,
                  lineHeight: 1,
                }}
              >
                {v}
              </div>{" "}
              <div
                style={{
                  fontSize: 9,
                  color: T.textMuted,
                  marginTop: 4,
                  fontFamily: "monospace",
                }}
              >
                {l.toUpperCase()}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <SubTabs
        tabs={[
          ["scan", " SCAN"],
          ["weight", "⚖️ WEIGHT"],
          ["checkin", "✅ CHECK-IN"],
          ["photos", " PHOTOS (" + photos.length + ")"],
        ]}
        active={bodyTab}
        onChange={setBodyTab}
        T={T}
      />{" "}
      <div style={{ padding: "14px 14px 0" }}>
        {" "}
        {bodyTab === "scan" && (
          <div>
            {" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <Lbl color={T.accent} style={{ marginBottom: 8 }}>
                HF FITNESS SCREENSHOT
              </Lbl>{" "}
              <div
                style={{
                  fontSize: 12,
                  color: T.textSub,
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                AI reads all values automatically. No internet needed after
                first load.
              </div>{" "}
              {!tReady && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.warning,
                    background: T.surfaceAlt,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 12,
                  }}
                >
                  ⏳ Loading scanner...
                </div>
              )}{" "}
              <div
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                {" "}
                <div
                  style={{
                    padding: "18px",
                    background: scanning || !tReady ? "#333" : T.accent,
                    color: scanning || !tReady ? "#666" : "#000",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 14,
                    pointerEvents: "none",
                  }}
                >
                  {" "}
                  {scanning
                    ? " " + scanProgress
                    : " Upload HF Fitness Screenshot"}{" "}
                </div>{" "}
                <input
                  type="file"
                  accept="image/*"
                  onChange={analyseScan}
                  disabled={scanning || !tReady}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />{" "}
              </div>{" "}
              {scanError && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.danger,
                    background: "#ff4d4d15",
                    borderRadius: 10,
                    padding: "10px 14px",
                    border: "1px solid #ff4d4d30",
                  }}
                >
                  {scanError}
                </div>
              )}{" "}
            </div>{" "}
            {scanResult && !scanSaved && (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  marginBottom: 10,
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <div
                  style={{
                    fontSize: 12,
                    color: T.success,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  ✅ Detected — {fmtDate(scanResult.date)}
                </div>{" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {" "}
                  {[
                    ["Weight", "weight", "kg"],
                    ["Body Fat", "bodyFat", "%"],
                    ["BMI", "bmi", ""],
                    ["Muscle%", "muscleRate", "%"],
                    ["Water%", "bodyWater", "%"],
                    ["Bone", "boneMass", "kg"],
                    ["Protein%", "proteinRate", "%"],
                    ["BMR", "bmr", "kcal"],
                    ["Visceral", "visceralFat", ""],
                  ].map(([label, key, unit]) => (
                    <div
                      key={key}
                      style={{
                        background: T.surfaceAlt,
                        borderRadius: 12,
                        padding: "10px 8px",
                        textAlign: "center",
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          fontSize: 9,
                          color: T.textMuted,
                          fontFamily: "monospace",
                          marginBottom: 4,
                        }}
                      >
                        {label.toUpperCase()}
                      </div>{" "}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {" "}
                        <input
                          type="number"
                          step="0.1"
                          value={scanResult[key] ?? ""}
                          onChange={(e) =>
                            setScanResult((p) => ({
                              ...p,
                              [key]:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            }))
                          }
                          placeholder="—"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            padding: "7px 4px",
                            borderRadius: 8,
                            border: `1px solid ${T.border}`,
                            background: T.surface,
                            color: T.text,
                            fontSize: 14,
                            fontWeight: 800,
                            textAlign: "center",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />{" "}
                        <span
                          style={{
                            fontSize: 10,
                            color: T.textMuted,
                            flexShrink: 0,
                          }}
                        >
                          {unit}
                        </span>{" "}
                      </div>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={confirmScan}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: T.accent,
                    color: "#000",
                    border: "none",
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {" "}
                  Save to Body Log
                </button>{" "}
              </div>
            )}{" "}
            {scanSaved && (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "28px",
                  textAlign: "center",
                  border: "1px solid #22c55e40",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: T.success }}
                >
                  Saved!
                </div>
              </div>
            )}{" "}
            {latestScan && (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  marginBottom: 10,
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                  PROGRESS VS BASELINE
                </Lbl>{" "}
                {[
                  ["Weight", "weight", "kg", true],
                  ["Body Fat", "bodyFat", "%", true],
                  ["Muscle Rate", "muscleRate", "%", false],
                  ["BMI", "bmi", "", true],
                  ["Visceral Fat", "visceralFat", "", true],
                  ["BMR", "bmr", "kcal", false],
                ].map(([label, key, unit, lowerBetter]) => {
                  if (latestScan[key] == null) return null;
                  const diff = (latestScan[key] - baseline[key]).toFixed(1);
                  const isGood = lowerBetter
                    ? parseFloat(diff) < 0
                    : parseFloat(diff) > 0;
                  const arrow =
                    parseFloat(diff) < 0
                      ? "↓"
                      : parseFloat(diff) > 0
                        ? "↑"
                        : "→";
                  const color =
                    parseFloat(diff) === 0
                      ? T.textSub
                      : isGood
                        ? T.success
                        : T.danger;
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      {" "}
                      <span style={{ fontSize: 13, color: T.textSub }}>
                        {label}
                      </span>{" "}
                      <div>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {latestScan[key]}
                          {unit}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color,
                            fontWeight: 700,
                            marginLeft: 8,
                          }}
                        >
                          {arrow} {Math.abs(parseFloat(diff))}
                          {unit}
                        </span>
                      </div>{" "}
                    </div>
                  );
                })}{" "}
                <div
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Baseline: 66.2kg · 22.7% BF · 46.3% muscle
                </div>{" "}
              </div>
            )}{" "}
            {bodyScanLog.length > 1 && (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                  SCAN HISTORY ({bodyScanLog.length})
                </Lbl>{" "}
                {[...bodyScanLog].reverse().map((scan, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    {" "}
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: T.text }}
                      >
                        {fmtDate(scan.date)}
                      </div>
                      <div
                        style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}
                      >
                        {scan.weight && scan.weight + "kg"}
                        {scan.bodyFat && " · " + scan.bodyFat + "% BF"}
                        {scan.visceralFat && " · VF:" + scan.visceralFat}
                      </div>
                    </div>{" "}
                    {scan.weight && (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            scan.weight < baseline.weight
                              ? T.success
                              : T.danger,
                        }}
                      >
                        {scan.weight < baseline.weight ? "↓" : "↑"}
                        {Math.abs(scan.weight - baseline.weight).toFixed(1)}kg
                      </div>
                    )}{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {bodyTab === "weight" && (
          <div>
            {" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <Lbl color={T.accent} style={{ marginBottom: 12 }}>
                {todayEntry
                  ? "TODAY: " + todayEntry.weight + "KG"
                  : "LOG TODAY'S WEIGHT"}
              </Lbl>{" "}
              <div style={{ display: "flex", gap: 10 }}>
                {" "}
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder={
                    todayEntry
                      ? "Update (" + todayEntry.weight + ")"
                      : "e.g. 63.5"
                  }
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 14,
                    border: `1px solid ${T.border}`,
                    fontSize: 22,
                    fontFamily: "inherit",
                    outline: "none",
                    background: T.surfaceAlt,
                    color: T.text,
                    fontWeight: 700,
                  }}
                />{" "}
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: "16px 24px",
                    background: T.accent,
                    color: "#000",
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    minWidth: 80,
                  }}
                >
                  {saved ? "✅" : "Save"}
                </button>{" "}
              </div>{" "}
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 10 }}>
                ⏰ Weigh first thing in the morning
              </div>{" "}
            </div>{" "}
            {chartData.length > 1 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  marginBottom: 10,
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                  WEIGHT TREND (30 DAYS)
                </Lbl>{" "}
                <ResponsiveContainer width="100%" height={160}>
                  {" "}
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    {" "}
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: T.textMuted }}
                    />{" "}
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 9, fill: T.textMuted }}
                    />{" "}
                    <Tooltip
                      contentStyle={{
                        background: T.surfaceAlt,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        fontSize: 11,
                        color: T.text,
                      }}
                    />{" "}
                    <ReferenceLine
                      y={67}
                      stroke={T.accent + "40"}
                      strokeDasharray="4 4"
                    />{" "}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={T.accent}
                      strokeWidth={2.5}
                      dot={{ fill: T.accent, r: 4, strokeWidth: 0 }}
                    />{" "}
                  </LineChart>{" "}
                </ResponsiveContainer>{" "}
                <div
                  style={{
                    fontSize: 10,
                    color: T.textMuted,
                    textAlign: "center",
                    marginTop: 6,
                  }}
                >
                  Dashed = starting weight 67kg
                </div>{" "}
              </div>
            ) : (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "40px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ fontSize: 13, color: T.textSub }}>
                  Log weight daily to see your trend
                </div>
              </div>
            )}{" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                YOUR STATS
              </Lbl>{" "}
              {[
                ["Starting Weight", "67kg"],
                ["Height", "168cm"],
                ["Age", "28"],
                ["Calorie Target", "1,950 kcal"],
                ["Protein Target", "134g/day"],
                ["Body Fat (baseline)", "22.7%"],
                ["Visceral Fat (baseline)", "8"],
                ["BMI", bmi || "—"],
                ["Goal", "Body recomposition "],
              ].map(([l, v], i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                  }}
                >
                  {" "}
                  <span style={{ fontSize: 13, color: T.textSub }}>{l}</span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                  >
                    {v}
                  </span>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {bodyTab === "checkin" && (
          <div>
            {" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <Lbl color={T.accent} style={{ marginBottom: 8 }}>
                DAILY RECOVERY CHECK-IN
              </Lbl>{" "}
              <div
                style={{
                  fontSize: 12,
                  color: T.textSub,
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                Use this to protect training performance while cutting. Poor
                recovery + falling strength = diet too aggressive.
              </div>{" "}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {" "}
                {[
                  ["Sleep hours", "sleep", "number"],
                  ["Steps", "steps", "number"],
                ].map(([l, k, type]) => (
                  <div key={k}>
                    {" "}
                    <div
                      style={{
                        fontSize: 10,
                        color: T.textMuted,
                        fontFamily: "monospace",
                        marginBottom: 5,
                        letterSpacing: 1,
                      }}
                    >
                      {l.toUpperCase()}
                    </div>{" "}
                    <input
                      type={type}
                      value={checkin[k]}
                      onChange={(e) =>
                        setCheckin((p) => ({ ...p, [k]: e.target.value }))
                      }
                      placeholder={k === "sleep" ? "7.5" : "8000"}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 12,
                        border: `1px solid ${T.border}`,
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: "inherit",
                        outline: "none",
                        background: T.surfaceAlt,
                        color: T.text,
                        boxSizing: "border-box",
                      }}
                    />{" "}
                  </div>
                ))}{" "}
              </div>{" "}
              {[
                ["Energy", "energy"],
                ["Stress", "stress"],
                ["Soreness", "soreness"],
              ].map(([l, k]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  {" "}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ fontSize: 12, color: T.textSub }}>{l}</span>
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: T.accent }}
                    >
                      {checkin[k]}/5
                    </span>
                  </div>{" "}
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={checkin[k]}
                    onChange={(e) =>
                      setCheckin((p) => ({ ...p, [k]: e.target.value }))
                    }
                    style={{ width: "100%", accentColor: T.accent }}
                  />{" "}
                </div>
              ))}{" "}
              <textarea
                value={checkin.notes}
                onChange={(e) =>
                  setCheckin((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Notes: hunger, cravings, digestion, training readiness..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: T.surfaceAlt,
                  color: T.text,
                  marginBottom: 12,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />{" "}
              <button
                type="button"
                onClick={handleSaveCheckin}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: T.accent,
                  color: "#000",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {checkinSaved ? "✅ Saved" : "Save Check-In"}
              </button>{" "}
            </div>{" "}
            {checkins.length > 0 && (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "18px",
                  border: `1px solid ${T.border}`,
                }}
              >
                {" "}
                <Lbl color={T.accent} style={{ marginBottom: 14 }}>
                  RECENT CHECK-INS
                </Lbl>{" "}
                {[...checkins]
                  .reverse()
                  .slice(0, 7)
                  .map((c) => (
                    <div
                      key={c.date}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {fmtDate(c.date)}
                        </span>
                        <span style={{ fontSize: 11, color: T.textSub }}>
                          Sleep {c.sleep || "—"}h · Energy {c.energy}/5 · Stress{" "}
                          {c.stress}/5
                        </span>
                      </div>{" "}
                      {c.notes && (
                        <div
                          style={{
                            fontSize: 11,
                            color: T.textSub,
                            marginTop: 5,
                            lineHeight: 1.4,
                          }}
                        >
                          {c.notes}
                        </div>
                      )}{" "}
                    </div>
                  ))}{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {bodyTab === "photos" && (
          <div>
            {" "}
            <div
              style={{
                background: T.surface,
                borderRadius: 20,
                padding: "18px",
                marginBottom: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              {" "}
              <Lbl color={T.accent} style={{ marginBottom: 8 }}>
                ADD PROGRESS PHOTO
              </Lbl>{" "}
              <input
                type="text"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="Optional note (e.g. Week 3 front)"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  background: T.surfaceAlt,
                  color: T.text,
                  marginBottom: 12,
                  boxSizing: "border-box",
                }}
              />{" "}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {" "}
                {[
                  ["", "Take Photo", "environment"],
                  ["️", "Upload", ""],
                ].map(([icon, label, capture]) => (
                  <div
                    key={label}
                    style={{
                      position: "relative",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        padding: "18px 10px",
                        background:
                          label === "Take Photo" ? T.accent : T.surfaceAlt,
                        color: label === "Take Photo" ? "#000" : T.textSub,
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        border: `1px solid ${T.border}`,
                        pointerEvents: "none",
                      }}
                    >
                      {" "}
                      <div style={{ fontSize: 24, marginBottom: 6 }}>
                        {icon}
                      </div>
                      {uploading ? "Saving..." : label}{" "}
                    </div>{" "}
                    <input
                      type="file"
                      accept="image/*"
                      {...(capture ? { capture } : {})}
                      onChange={handlePhoto}
                      disabled={uploading}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                      }}
                    />{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {photos.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 20,
                  padding: "60px 20px",
                  textAlign: "center",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📸</div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.textSub }}
                >
                  No photos yet
                </div>
              </div>
            ) : (
              <div>
                {" "}
                <div
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    fontFamily: "monospace",
                    marginBottom: 10,
                  }}
                >
                  {photos.length} PHOTOS
                </div>{" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {" "}
                  {[...photos].reverse().map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setViewPhoto(photo)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 16,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {" "}
                      <img
                        src={photo.dataUrl}
                        alt="Progress"
                        style={{
                          width: "100%",
                          aspectRatio: "3/4",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />{" "}
                      <div
                        style={{
                          background:
                            "linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)",
                          padding: "20px 10px 10px",
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                        }}
                      >
                        {" "}
                        <div
                          style={{
                            fontSize: 11,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          {fmtDate(photo.date)}
                        </div>{" "}
                        {photo.note && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.6)",
                              marginTop: 2,
                            }}
                          >
                            {photo.note}
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
              </div>
            )}{" "}
            {viewPhoto && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.97)",
                  zIndex: 9999,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    color: "#fff",
                  }}
                >
                  {" "}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {fmtDate(viewPhoto.date)}
                    </div>
                    {viewPhoto.note && (
                      <div style={{ fontSize: 11, color: "#aaa" }}>
                        {viewPhoto.note}
                      </div>
                    )}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 10 }}>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        onDeletePhoto(viewPhoto.id);
                        setViewPhoto(null);
                      }}
                      style={{
                        padding: "8px 16px",
                        background: T.danger,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Delete
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => setViewPhoto(null)}
                      style={{
                        padding: "8px 16px",
                        background: "#333",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Close
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 20px 20px",
                  }}
                >
                  {" "}
                  <img
                    src={viewPhoto.dataUrl}
                    alt="Progress"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 12,
                    }}
                  />{" "}
                </div>{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function SuppsTab({ suppLog, onToggle, globalDate, onDateChange, T }) {
  const pct = Math.round((suppLog.length / SUPPLEMENTS.length) * 100);
  const groups = [
    {
      title: "Morning",
      items: SUPPLEMENTS.filter((s) => s.time === "Morning"),
    },
    {
      title: "With Dinner",
      items: SUPPLEMENTS.filter((s) => s.time === "With Dinner"),
    },
    {
      title: "Before Bed",
      items: SUPPLEMENTS.filter((s) => s.time === "Before Bed"),
    },
  ];
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <div
        style={{
          padding: "52px 20px 20px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 8 }}>
          SUPPLEMENTS
        </Lbl>{" "}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          {" "}
          <span style={{ fontSize: 14, color: T.textSub }}>
            Daily stack
          </span>{" "}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: pct === 100 ? T.success : T.accent,
            }}
          >
            {suppLog.length}/{SUPPLEMENTS.length} taken
          </span>{" "}
        </div>{" "}
        <div style={{ height: 6, background: T.border, borderRadius: 99 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: pct === 100 ? T.success : T.accent,
              borderRadius: 99,
              transition: "width 0.4s",
            }}
          />
        </div>{" "}
      </div>{" "}
      <DateNav date={globalDate} onChange={onDateChange} T={T} />{" "}
      <div style={{ padding: "14px 14px 0" }}>
        {" "}
        {groups.map((group) => (
          <div key={group.title} style={{ marginBottom: 10 }}>
            {" "}
            <div
              style={{
                fontSize: 10,
                color: T.textMuted,
                fontFamily: "monospace",
                letterSpacing: 2,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              {group.title.toUpperCase()}
            </div>{" "}
            {group.items.map((supp) => {
              const done = suppLog.includes(supp.id);
              return (
                <button
                  key={supp.id}
                  type="button"
                  onClick={() => onToggle(supp.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 18px",
                    marginBottom: 8,
                    borderRadius: 18,
                    cursor: "pointer",
                    textAlign: "left",
                    background: done ? supp.color + "15" : T.surface,
                    border: `1px solid ${done ? supp.color + "40" : T.border}`,
                    transition: "all 0.2s",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      flexShrink: 0,
                      background: done ? supp.color : "#1e1e1e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: done ? 18 : 20,
                      color: done ? "#fff" : T.textMuted,
                      fontWeight: 700,
                      border: `1px solid ${done ? supp.color + "60" : T.border}`,
                    }}
                  >
                    {" "}
                    {done ? "✓" : supp.emoji}{" "}
                  </div>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: done ? supp.color : T.text,
                      }}
                    >
                      {supp.label}
                    </div>{" "}
                    <div
                      style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}
                    >
                      {supp.time}
                    </div>{" "}
                  </div>{" "}
                  {done && <div style={{ fontSize: 20 }}>✅</div>}{" "}
                </button>
              );
            })}{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
function SettingsTab({ settings, onSave, T, accent }) {
  const [local, setLocal] = useState(settings),
    [saved, setSaved] = useState(false);
  function save() {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {" "}
      <div
        style={{
          padding: "52px 20px 28px",
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {" "}
        <Lbl color={T.accent} style={{ marginBottom: 8 }}>
          SETTINGS
        </Lbl>{" "}
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>
          Appearance
        </div>{" "}
      </div>{" "}
      <div style={{ padding: "20px 16px 0" }}>
        {" "}
        <div
          style={{
            background: T.surface,
            borderRadius: 20,
            padding: "20px",
            marginBottom: 12,
            border: `1px solid ${T.border}`,
          }}
        >
          {" "}
          <Lbl color={T.accent} style={{ marginBottom: 16 }}>
            ACCENT COLOUR
          </Lbl>{" "}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 10,
            }}
          >
            {" "}
            {ACCENT_COLORS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setLocal((p) => ({ ...p, accent: a.id }))}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 4px",
                  borderRadius: 14,
                  border: `2px solid ${local.accent === a.id ? a.value : T.border}`,
                  background:
                    local.accent === a.id ? a.value + "20" : T.surfaceAlt,
                  cursor: "pointer",
                }}
              >
                {" "}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: a.value,
                    border:
                      local.accent === a.id
                        ? "3px solid #fff"
                        : "2px solid transparent",
                  }}
                />{" "}
                <div
                  style={{
                    fontSize: 9,
                    color: local.accent === a.id ? a.value : T.textMuted,
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {a.label.toUpperCase()}
                </div>{" "}
              </button>
            ))}{" "}
          </div>{" "}
        </div>{" "}
        <div
          style={{
            background: T.surface,
            borderRadius: 20,
            padding: "20px",
            marginBottom: 12,
            border: `1px solid ${T.border}`,
          }}
        >
          {" "}
          <Lbl color={T.accent} style={{ marginBottom: 14 }}>
            PREVIEW
          </Lbl>{" "}
          <div
            style={{
              background: T.surfaceAlt,
              borderRadius: 14,
              padding: "16px",
              border: `1px solid ${T.border}`,
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 12,
              }}
            >
              {" "}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: getAccent(local.accent) + "20",
                  border: `2px solid ${getAccent(local.accent)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ️
              </div>{" "}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                  Your Fitness Hub
                </div>
                <div style={{ fontSize: 12, color: T.textSub }}>
                  Looking great{" "}
                </div>
              </div>{" "}
            </div>{" "}
            <div
              style={{
                height: 6,
                background: T.border,
                borderRadius: 99,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "72%",
                  background: getAccent(local.accent),
                  borderRadius: 99,
                }}
              />
            </div>{" "}
            <div style={{ display: "flex", gap: 8 }}>
              {" "}
              {["1950 kcal", "134g P", "230g C", "55g F"].map((v, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    background: T.surface,
                    borderRadius: 8,
                    padding: "6px 4px",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {" "}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        i === 0
                          ? getAccent(local.accent)
                          : ["#22c55e", "#4facfe", "#f59e0b"][i - 1],
                    }}
                  >
                    {v}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <button
          type="button"
          onClick={save}
          style={{
            width: "100%",
            padding: "17px",
            background: saved ? T.success : T.accent,
            color: "#000",
            border: "none",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {" "}
          {saved ? "✅ Saved!" : "Save Settings"}{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
export default function App() {
  const [tab, setTab] = useState("home"),
    [globalDate, setGlobalDate] = useState(getToday()),
    [foodLog, setFoodLog] = useState([]),
    [suppLog, setSuppLog] = useState([]),
    [weightLog, setWeightLog] = useState([]),
    [checkins, setCheckins] = useState([]),
    [photos, setPhotos] = useState([]),
    [weeklyData, setWeeklyData] = useState([]),
    [myFoods, setMyFoods] = useState([]),
    [foodHistory, setFoodHistory] = useState([]),
    [meals, setMeals] = useState(DEFAULT_MEALS),
    [sessions, setSessions] = useState([]),
    [bodyScanLog, setBodyScanLog] = useState([]),
    [waterLog, setWaterLog] = useState(0),
    [settings, setSettings] = useState({ accent: "orange" }),
    [ready, setReady] = useState(false);
  const accent = getAccent(settings.accent);
  const T = tokens(accent);
  useEffect(() => {
    (async () => {
      const today = getToday();
      const [fd, sl, wd, ciDoc, mf, ml, bsl, wtr, stg] = await Promise.all([
        fbGet("food", today),
        fbGet("supplements", today),
        fbGet("stats", "weight"),
        fbGet("data", "checkins"),
        fbGet("data", "myfoods"),
        fbGet("data", "meals"),
        fbGet("data", "bodyscans"),
        fbGet("water", today),
        fbGet("data", "settings"),
      ]);
      const wl = wd?.entries || [];
      setFoodLog(fd?.items || []);
      setSuppLog(sl?.taken || []);
      setWeightLog(wl);
      setCheckins(ciDoc?.entries || []);
      setMyFoods(mf?.items || []);
      setMeals(ml?.meals || DEFAULT_MEALS);
      setBodyScanLog(bsl?.scans || []);
      setWaterLog(wtr?.glasses || 0);
      if (stg?.accent) setSettings(stg);
      const [allPhotos, allSessions] = await Promise.all([
        fbGetAll("photos"),
        fbGetAll("sessions"),
      ]);
      allPhotos.sort((a, b) => a.date.localeCompare(b.date));
      setPhotos(allPhotos);
      allSessions.sort((a, b) => a.date.localeCompare(b.date));
      setSessions(allSessions);
      const [bankDoc, allFoodDocs] = await Promise.all([
        fbGet("data", "foodHistory"),
        fbGetAll("food"),
      ]);
      const generatedBank = mergeFoodBank([
        ...(bankDoc?.items || []),
        ...allFoodDocs.flatMap((d) => d.items || []),
        ...(mf?.items || []),
      ]);
      setFoodHistory(generatedBank);
      if (generatedBank.length)
        fbSet("data", "foodHistory", {
          items: generatedBank,
          updatedAt: new Date().toISOString(),
        });
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const df =
          dateStr === today
            ? fd?.items || []
            : (await fbGet("food", dateStr))?.items || [];
        const wEntry = wl.find((w) => w.date === dateStr);
        days.push({
          date: dateStr,
          shortLabel: dayLabel(dateStr),
          kcal: Math.round(df.reduce((s, f) => s + (Number(f.kcal) || 0), 0)),
          protein: Math.round(
            df.reduce((s, f) => s + (Number(f.protein) || 0), 0),
          ),
          weight: wEntry ? wEntry.weight : null,
          sessions: allSessions.filter((s) => s.date === dateStr).length,
        });
      }
      setWeeklyData(days);
      setReady(true);
    })();
  }, []);
  async function changeDate(date) {
    setGlobalDate(date);
    const [fd, sl] = await Promise.all([
      fbGet("food", date),
      fbGet("supplements", date),
    ]);
    setFoodLog(fd?.items || []);
    setSuppLog(sl?.taken || []);
  }
  async function upsertFoodHistory(food) {
    const clean = cleanFoodForBank(food);
    if (!clean.name) return;
    const updated = mergeFoodBank([clean, ...foodHistory]);
    setFoodHistory(updated);
    await fbSet("data", "foodHistory", {
      items: updated,
      updatedAt: new Date().toISOString(),
    });
  }
  async function addFood(item) {
    const updated = [...foodLog, item];
    setFoodLog(updated);
    await fbSet("food", globalDate, { items: updated, date: globalDate });
    await upsertFoodHistory(item);
    if (globalDate === getToday())
      setWeeklyData((prev) =>
        prev.map((d) =>
          d.date === globalDate
            ? {
                ...d,
                kcal: Math.round(
                  updated.reduce((s, f) => s + (Number(f.kcal) || 0), 0),
                ),
                protein: Math.round(
                  updated.reduce((s, f) => s + (Number(f.protein) || 0), 0),
                ),
              }
            : d,
        ),
      );
  }
  async function removeFood(id) {
    const updated = foodLog.filter((f) => f.id !== id);
    setFoodLog(updated);
    await fbSet("food", globalDate, { items: updated, date: globalDate });
  }
  async function toggleSupp(id) {
    const updated = suppLog.includes(id)
      ? suppLog.filter((s) => s !== id)
      : [...suppLog, id];
    setSuppLog(updated);
    await fbSet("supplements", globalDate, {
      taken: updated,
      date: globalDate,
    });
  }
  async function addWeight(entry) {
    const updated = [
      ...weightLog.filter((w) => w.date !== entry.date),
      entry,
    ].sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(updated);
    await fbSet("stats", "weight", { entries: updated });
    setWeeklyData((prev) =>
      prev.map((d) =>
        d.date === entry.date ? { ...d, weight: entry.weight } : d,
      ),
    );
  }
  async function saveCheckin(entry) {
    const updated = [
      ...checkins.filter((c) => c.date !== entry.date),
      entry,
    ].sort((a, b) => a.date.localeCompare(b.date));
    setCheckins(updated);
    await fbSet("data", "checkins", { entries: updated });
  }
  async function addPhoto(photo) {
    await fbSet("photos", photo.id, photo);
    setPhotos((prev) => [...prev, photo]);
  }
  async function deletePhoto(id) {
    await fbDel("photos", id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }
  async function saveMyFood(food) {
    const updated = [...myFoods.filter((f) => f.name !== food.name), food];
    setMyFoods(updated);
    await fbSet("data", "myfoods", { items: updated });
    await upsertFoodHistory(food);
  }
  async function deleteMyFood(name) {
    const updated = myFoods.filter((f) => f.name !== name);
    setMyFoods(updated);
    await fbSet("data", "myfoods", { items: updated });
  }
  async function saveMeals(updated) {
    setMeals(updated);
    await fbSet("data", "meals", { meals: updated });
  }
  async function saveSession(session) {
    await fbSet("sessions", session.id, session);
    setSessions((prev) =>
      [...prev, session].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setWeeklyData((prev) =>
      prev.map((d) =>
        d.date === session.date ? { ...d, sessions: (d.sessions || 0) + 1 } : d,
      ),
    );
  }
  async function deleteSession(id) {
    const s = sessions.find((s) => s.id === id);
    await fbDel("sessions", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (s)
      setWeeklyData((prev) =>
        prev.map((d) =>
          d.date === s.date
            ? { ...d, sessions: Math.max((d.sessions || 0) - 1, 0) }
            : d,
        ),
      );
  }
  async function saveBodyScan(scan) {
    const updated = [
      ...bodyScanLog.filter((s) => s.date !== scan.date),
      scan,
    ].sort((a, b) => a.date.localeCompare(b.date));
    setBodyScanLog(updated);
    await fbSet("data", "bodyscans", { scans: updated });
    if (scan.weight) {
      const wUp = [
        ...weightLog.filter((w) => w.date !== scan.date),
        { date: scan.date, weight: scan.weight },
      ].sort((a, b) => a.date.localeCompare(b.date));
      setWeightLog(wUp);
      await fbSet("stats", "weight", { entries: wUp });
    }
  }
  async function logWater(glasses) {
    setWaterLog(glasses);
    await fbSet("water", getToday(), { glasses, date: getToday() });
  }
  async function saveSettings(s) {
    setSettings(s);
    await fbSet("data", "settings", s);
  }
  function exportData() {
    const data = {
      foodLog,
      suppLog,
      weightLog,
      checkins,
      myFoods,
      foodHistory,
      meals,
      sessions,
      bodyScanLog,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitness-hub-" + getToday() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const totals = foodLog.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (Number(f.kcal) || 0),
      protein: acc.protein + (Number(f.protein) || 0),
      carbs: acc.carbs + (Number(f.carbs) || 0),
      fat: acc.fat + (Number(f.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  if (!ready)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0a0a",
        }}
      >
        {" "}
        <div style={{ fontSize: 44, marginBottom: 16 }}>🏋️</div>{" "}
        <div
          style={{
            fontSize: 12,
            color: "#444",
            fontFamily: "monospace",
            letterSpacing: 3,
          }}
        >
          LOADING...
        </div>{" "}
      </div>
    );
  const TABS = [
    { id: "home", label: "HOME", e: "🏠" },
    { id: "log", label: "LOG", e: "📝" },
    { id: "train", label: "TRAIN", e: "🏋️" },
    { id: "body", label: "BODY", e: "⚖️" },
    { id: "supps", label: "SUPPS", e: "💊" },
    { id: "settings", label: "SET", e: "⚙️" },
  ];
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "Georgia,serif",
      }}
    >
      {" "}
      <div style={{ paddingBottom: 80 }}>
        {" "}
        {tab === "home" && (
          <HomeTab
            totals={totals}
            foodLog={foodLog}
            suppLog={suppLog}
            weightLog={weightLog}
            weeklyData={weeklyData}
            sessions={sessions}
            onExport={exportData}
            waterLog={waterLog}
            onLogWater={logWater}
            T={T}
          />
        )}{" "}
        {tab === "log" && (
          <LogTab
            foodLog={foodLog}
            totals={totals}
            onAdd={addFood}
            onRemove={removeFood}
            myFoods={myFoods}
            foodHistory={foodHistory}
            onSaveFood={saveMyFood}
            onDeleteMyFood={deleteMyFood}
            meals={meals}
            onSaveMeals={saveMeals}
            globalDate={globalDate}
            onDateChange={changeDate}
            T={T}
          />
        )}{" "}
        {tab === "train" && (
          <TrainTab
            sessions={sessions}
            onSaveSession={saveSession}
            onDeleteSession={deleteSession}
            weeklyData={weeklyData}
            globalDate={globalDate}
            onDateChange={changeDate}
            T={T}
          />
        )}{" "}
        {tab === "body" && (
          <BodyTab
            weightLog={weightLog}
            onAdd={addWeight}
            photos={photos}
            onAddPhoto={addPhoto}
            onDeletePhoto={deletePhoto}
            bodyScanLog={bodyScanLog}
            onSaveScan={saveBodyScan}
            checkins={checkins}
            onSaveCheckin={saveCheckin}
            T={T}
          />
        )}{" "}
        {tab === "supps" && (
          <SuppsTab
            suppLog={suppLog}
            onToggle={toggleSupp}
            globalDate={globalDate}
            onDateChange={changeDate}
            T={T}
          />
        )}{" "}
        {tab === "settings" && (
          <SettingsTab
            settings={settings}
            onSave={saveSettings}
            T={T}
            accent={accent}
          />
        )}{" "}
      </div>{" "}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: T.surface,
          zIndex: 999,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {" "}
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 0 12px",
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
            }}
          >
            {" "}
            {tab === t.id && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 2,
                  background: T.accent,
                  borderRadius: 99,
                }}
              />
            )}{" "}
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.e}</span>{" "}
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                fontFamily: "monospace",
                color: tab === t.id ? T.accent : T.textMuted,
                letterSpacing: 0.5,
              }}
            >
              {t.label}
            </span>{" "}
          </button>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
