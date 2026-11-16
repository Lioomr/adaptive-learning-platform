"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toneHex } from "@/components/learning/mastery";
import { MASTERY_BANDS, masteryBand } from "@/services/mastery";
import type { MasteryBand } from "@/types";

// Bar animation is disabled: Recharts does not honour prefers-reduced-motion, and the data is static.
const axis = { fontSize: 12, fill: "#475569" };
const grid = "#E2E8F0";

/** Visually hidden table that mirrors chart data for screen readers. */
function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="sr-only">
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={String(r[0])}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/** Number of students in each mastery band. */
export function BandDistributionChart({ counts, caption }: { counts: Record<MasteryBand, number>; caption: string }) {
  const data = MASTERY_BANDS.map(b => ({ band: b.band, students: counts[b.band], fill: toneHex[b.tone] }));
  return (
    <figure className="m-0">
      <div className="h-[220px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis dataKey="band" tick={axis} tickLine={false} axisLine={{ stroke: grid }} interval={0} tickFormatter={(v: string) => v.replace("Needs Support", "Support")} />
            <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} width={48} />
            <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: 8, borderColor: grid, fontSize: 12 }} />
            <Bar isAnimationActive={false} dataKey="students" name="Students" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {data.map(d => <Cell key={d.band} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={caption} headers={["Band", "Students"]} rows={data.map(d => [d.band, d.students])} />
    </figure>
  );
}

/** Horizontal bars of class-average mastery per concept, coloured by band. */
export function ConceptAverageChart({ data, caption }: { data: { concept: string; average: number }[]; caption: string }) {
  const rows = data.map(d => ({ ...d, fill: toneHex[masteryBand(d.average).tone] }));
  return (
    <figure className="m-0">
      <div className="w-full" style={{ height: Math.max(220, rows.length * 30 + 24) }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <CartesianGrid horizontal={false} stroke={grid} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 40, 70, 85, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
            <YAxis type="category" dataKey="concept" tick={axis} tickLine={false} axisLine={false} width={104} />
            <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={v => [`${v}%`, "Class average"]} contentStyle={{ borderRadius: 8, borderColor: grid, fontSize: 12 }} />
            <Bar isAnimationActive={false} dataKey="average" name="Class average" radius={[0, 4, 4, 0]} barSize={14}>
              {rows.map(d => <Cell key={d.concept} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={caption} headers={["Concept", "Class average %"]} rows={rows.map(d => [d.concept, d.average])} />
    </figure>
  );
}

/** Per-student course averages, grouped by course. */
export function CourseComparisonChart({ data, caption }: { data: { name: string; python: number; math: number }[]; caption: string }) {
  return (
    <figure className="m-0">
      <div className="w-full" style={{ height: Math.max(260, data.length * 38 + 56) }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barGap={2} accessibilityLayer={false}>
            <CartesianGrid horizontal={false} stroke={grid} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 40, 70, 85, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
            <YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={64} />
            <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: 8, borderColor: grid, fontSize: 12 }} formatter={v => `${v}%`} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#475569" }} />
            <Bar isAnimationActive={false} dataKey="python" name="Python" fill="#2D4485" radius={[0, 4, 4, 0]} barSize={10} />
            <Bar isAnimationActive={false} dataKey="math" name="Mathematics" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={caption} headers={["Student", "Python %", "Mathematics %"]} rows={data.map(d => [d.name, d.python, d.math])} />
    </figure>
  );
}
