import React, { useState } from "react";
import ReactDOM from "react-dom/client";


const NAVY = "#1B3A6B";
const GOLD = "#C9A84C";
const DARK = "#0d1b2a";

const TONES = [
  { id: "positive", label: "🌟 Positive", desc: "Strong performance, celebrate wins" },
  { id: "growth", label: "📈 Growth-Focused", desc: "Progress made, more to achieve" },
  { id: "concern", label: "⚠️ Needs Improvement", desc: "Honest, professional, constructive" },
  { id: "mixed", label: "⚖️ Mixed", desc: "Strengths acknowledged, growth areas noted" },
];

const SUBJECTS = ["General / Homeroom", "English / ELA", "Math", "Science", "Social Studies", "Business", "History", "Art", "PE / Health", "Foreign Language", "Special Education", "Other"];
const GRADES = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];
const PERIODS = ["Q1", "Q2", "Q3", "Q4", "Semester 1", "Semester 2", "Mid-Year", "End of Year"];
const LENGTHS = [
  { id: "short", label: "Short", desc: "1–2 sentences" },
  { id: "medium", label: "Medium", desc: "3–4 sentences" },
];

// Behavior options grouped — positive and growth areas
const POSITIVE_BEHAVIORS = [
  "participates actively",
  "completes work on time",
  "works well with others",
  "shows leadership",
  "asks great questions",
  "helps classmates",
  "shows improvement",
  "strong test performance",
  "creative thinker",
  "respectful in class",
  "takes initiative",
  "consistent effort",
  "strong writing skills",
  "strong problem solver",
  "great class discussions",
  "organized and prepared",
  "positive attitude",
  "accepts feedback well",
];

const GROWTH_BEHAVIORS = [
  "needs redirecting",
  "struggles with focus",
  "missing assignments",
  "needs support with reading",
  "needs support with math",
  "inconsistent effort",
  "struggles with deadlines",
  "needs to participate more",
  "difficulty working in groups",
  "test anxiety",
  "talks during instruction",
  "off-task behavior",
  "needs organizational support",
  "rushes through work",
  "needs to ask for help",
  "frequent absences",
];

const inp = (extra = {}) => ({
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  color: "#fff",
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  WebkitAppearance: "none",
  ...extra,
});

const Label = ({ text, required }) => (
  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>
    {text} {required && <span style={{ color: GOLD }}>*</span>}
  </div>
);

// Strip any AI markdown formatting before display — keep clean prose
const cleanComment = (text) =>
  text
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-•]\s*/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function App() {
  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [period, setPeriod] = useState("");
  const [tone, setTone] = useState("positive");
  const [length, setLength] = useState("medium");
  const [positiveBehaviors, setPositiveBehaviors] = useState([]);
  const [growthBehaviors, setGrowthBehaviors] = useState([]);
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const togglePositive = (b) => {
    setPositiveBehaviors(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };
  const toggleGrowth = (b) => {
    setGrowthBehaviors(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const buildPrompt = () => {
    const lengthMap = {
      short: "1 to 2 sentences — keep it tight",
      medium: "3 to 4 sentences — concise but complete",
    };
    const toneMap = {
      positive: "warm and celebratory — highlight real strengths and specific achievements",
      growth: "encouraging and honest — acknowledge progress while pointing toward next steps",
      concern: "honest, professional, and constructive — name areas of concern with empathy and clarity, never with blame",
      mixed: "balanced — name real strengths and real growth areas with equal honesty",
    };

    const studentRef = studentName
      ? `Refer to the student as "${studentName}" or "this student" — alternate naturally to avoid repetition. Do not use he, she, they, his, her, their, him, or them.`
      : `Refer to the student as "this student" — do not use he, she, they, his, her, their, him, or them.`;

    return `You are a real K-12 teacher writing professional report card comments. Write the way an actual teacher would speak — warm, specific, and natural. Avoid AI-sounding language.

Generate exactly 2 different report card comments for the same student. Each should approach the same core message from a different angle and use different sentence structures. Number them 1 and 2.

CONTEXT:
Student: ${studentName || "the student"}
Subject: ${subject || "General"}
Grade Level: ${grade || "Not specified"}
Reporting Period: ${period || "Not specified"}
Tone: ${toneMap[tone]}
Length: ${lengthMap[length]}

${positiveBehaviors.length ? `Positive observations: ${positiveBehaviors.join(", ")}` : ""}
${growthBehaviors.length ? `Growth areas: ${growthBehaviors.join(", ")}` : ""}
${strengths ? `Specific strengths: ${strengths}` : ""}
${concerns ? `Areas of concern: ${concerns}` : ""}

WRITING RULES:
- ${studentRef}
- Sound like a real teacher who knows the student — not like AI
- NEVER use generic filler like "is a pleasure to have in class" or "continues to grow"
- NEVER use phrases like "demonstrates" or "exhibits" — use natural language instead
- Be specific to the observations and strengths provided
- Keep every comment parent-ready — no jargon, no buzzwords
- The two comments should feel meaningfully different, not just reworded

OUTPUT FORMAT:
- Output only the two comments, numbered 1 and 2
- No headers, no bullet points, no markdown formatting
- No preamble, no explanation, no closing notes
- Plain prose only — each comment is one continuous paragraph`;
  };

  const generate = async () => {
    if (!grade) { setError("Please select a grade level."); return; }
    setError(""); setResults([]); setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });
      const json = await res.json();
      if (json.error) { setError("Error: " + json.error.message); return; }
      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text) { setError("Nothing returned. Try again."); return; }

      // Parse the two numbered comments and clean any markdown artifacts
      const parsed = text
        .split(/\n(?=\d+\.)/)
        .map(s => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
        .map(cleanComment);

      setResults(parsed.length >= 2 ? parsed.slice(0, 2) : [cleanComment(text)]);
    } catch (e) {
      setError("Request failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setResults([]);
    setStudentName("");
    setPositiveBehaviors([]);
    setGrowthBehaviors([]);
    setStrengths("");
    setConcerns("");
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${DARK} 0%, ${NAVY} 100%)`, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "0 0 80px" }}>

      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#fff", letterSpacing: 1 }}>
          4THDMC <span style={{ color: GOLD }}>|</span> EVOLVE LLC
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Teacher Toolkit</div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 18px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: 4, padding: "4px 14px", marginBottom: 12, fontWeight: 700, borderRadius: 2, textTransform: "uppercase" }}>
            4THDMC | EVOLVE LLC
          </div>
          <div style={{ fontSize: "clamp(28px, 7vw, 44px)", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
            REPORT CARD<br /><span style={{ color: GOLD }}>COMMENT WRITER</span>
          </div>
          <div style={{ width: 40, height: 3, background: GOLD, margin: "12px 0 8px" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontStyle: "italic" }}>
            Two unique, ready-to-use comments. Built by a teacher.
          </div>
        </div>

        {/* FORM */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 18 }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>✦ Student Info</div>

          {/* Name (no more pronouns) */}
          <div style={{ marginBottom: 14 }}>
            <Label text="Student Name" />
            <input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Optional — leave blank to use 'this student'" style={inp()} />
          </div>

          {/* Subject + Grade */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <Label text="Subject" />
              <select value={subject} onChange={e => setSubject(e.target.value)} style={inp({ background: "#162d52", color: subject ? "#fff" : "rgba(255,255,255,0.35)" })}>
                <option value="">Select...</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label text="Grade Level" required />
              <select value={grade} onChange={e => setGrade(e.target.value)} style={inp({ background: "#162d52", color: grade ? "#fff" : "rgba(255,255,255,0.35)" })}>
                <option value="">Select...</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Period */}
          <div style={{ marginBottom: 4 }}>
            <Label text="Reporting Period" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: `1px solid ${period === p ? GOLD : "rgba(255,255,255,0.2)"}`,
                  background: period === p ? "rgba(201,168,76,0.15)" : "transparent",
                  color: period === p ? GOLD : "rgba(255,255,255,0.5)",
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* TONE + LENGTH */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 18 }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>✦ Comment Tone</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {TONES.map(({ id, label, desc }) => (
              <button key={id} onClick={() => setTone(id)} style={{
                padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                border: `1px solid ${tone === id ? GOLD : "rgba(255,255,255,0.15)"}`,
                background: tone === id ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: tone === id ? GOLD : "#fff", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{desc}</div>
              </button>
            ))}
          </div>

          {/* Length */}
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>✦ Comment Length</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LENGTHS.map(({ id, label, desc }) => (
              <button key={id} onClick={() => setLength(id)} style={{
                padding: "11px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                border: `1px solid ${length === id ? GOLD : "rgba(255,255,255,0.15)"}`,
                background: length === id ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: length === id ? GOLD : "#fff", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* POSITIVE BEHAVIORS */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 18 }}>
          <div style={{ color: "#5ecf8a", fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>✦ Positive Observations</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14 }}>Tap all that apply</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POSITIVE_BEHAVIORS.map(b => (
              <button key={b} onClick={() => togglePositive(b)} style={{
                padding: "7px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${positiveBehaviors.includes(b) ? "#5ecf8a" : "rgba(255,255,255,0.18)"}`,
                background: positiveBehaviors.includes(b) ? "rgba(94,207,138,0.18)" : "transparent",
                color: positiveBehaviors.includes(b) ? "#5ecf8a" : "rgba(255,255,255,0.5)",
              }}>{b}</button>
            ))}
          </div>
        </div>

        {/* GROWTH BEHAVIORS */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 18 }}>
          <div style={{ color: "#ffb066", fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>✦ Growth Areas</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14 }}>Tap all that apply</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GROWTH_BEHAVIORS.map(b => (
              <button key={b} onClick={() => toggleGrowth(b)} style={{
                padding: "7px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${growthBehaviors.includes(b) ? "#ffb066" : "rgba(255,255,255,0.18)"}`,
                background: growthBehaviors.includes(b) ? "rgba(255,176,102,0.18)" : "transparent",
                color: growthBehaviors.includes(b) ? "#ffb066" : "rgba(255,255,255,0.5)",
              }}>{b}</button>
            ))}
          </div>
        </div>

        {/* SPECIFIC STRENGTHS + CONCERNS */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 18 }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>✦ Specific Notes (Optional)</div>
          <div style={{ marginBottom: 14 }}>
            <Label text="Specific Strengths" />
            <textarea value={strengths} onChange={e => setStrengths(e.target.value)}
              placeholder="e.g. Excellent persuasive essay on environmental policy..."
              rows={2} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
          </div>
          <div>
            <Label text="Areas of Concern" />
            <textarea value={concerns} onChange={e => setConcerns(e.target.value)}
              placeholder="e.g. Missing 4 of last 6 assignments, struggles with fractions..."
              rows={2} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9090", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button onClick={generate} disabled={loading} style={{
          width: "100%", padding: 18, background: loading ? "rgba(201,168,76,0.4)" : GOLD,
          color: DARK, border: "none", borderRadius: 12, fontWeight: 900,
          fontSize: 16, letterSpacing: 3, cursor: loading ? "not-allowed" : "pointer",
          textTransform: "uppercase", boxShadow: loading ? "none" : "0 4px 24px rgba(201,168,76,0.3)",
          marginBottom: 32,
        }}>
          {loading ? "⏳  Writing Comments..." : "GENERATE 2 COMMENTS"}
        </button>

        {/* RESULTS */}
        {results.length > 0 && results.map((r, idx) => (
          <div key={idx} style={{ background: "#fff", borderRadius: 14, padding: "22px 20px", marginBottom: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: `2px solid ${GOLD}` }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: NAVY }}>
                  Option {idx + 1}
                </div>
                <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>
                  {studentName || "Student"} · {grade || ""} · {period || ""}
                </div>
              </div>
              <div style={{ background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" }}>
                Ready ✓
              </div>
            </div>
            <p style={{ fontSize: 15, color: "#333", lineHeight: 1.75, margin: "0 0 18px" }}>{r}</p>
            <button onClick={() => copy(r, idx)} style={{
              width: "100%", padding: "12px", background: copied === idx ? "#2a9d5c" : NAVY,
              color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: 1, transition: "background 0.2s",
            }}>
              {copied === idx ? "✓ Copied!" : "📋 Copy This Comment"}
            </button>
          </div>
        ))}

        {results.length > 0 && (
          <button onClick={reset} style={{
            width: "100%", padding: 15, background: "transparent", color: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontWeight: 700,
            fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1,
          }}>
            ← New Student
          </button>
        )}
      </div>

      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", padding: "20px 16px 24px" }}>
        <div>© 2025 <span style={{ color: "rgba(201,168,76,0.55)" }}>4THDMC | EVOLVE LLC</span> · All Rights Reserved</div>
        <div style={{ marginTop: 6, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.12)" }}>Brandon Russell · The Multiplier · Chattanooga, TN</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
