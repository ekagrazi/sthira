"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightsResponse } from "@/lib/api/types";

const guideColors = [
  "var(--guide-gita)",
  "var(--guide-marcus)",
  "var(--guide-buddha)",
  "var(--guide-rumi)",
  "var(--guide-camus)",
];

function shortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function MoodChart({ points }: { points: InsightsResponse["mood_points"] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Mood over time</CardTitle></CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <p className="py-12 text-center text-sm leading-6 text-muted-foreground">At least two days with mood scores are needed for a trend.</p>
        ) : (
          <>
            <div aria-label={`Mood trend across ${points.length} days`} className="h-64" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={points} margin={{ bottom: 4, left: -18, right: 12, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={28} tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(value) => shortDate(String(value))} />
                  <Line dataKey="sentiment_score" dot={false} stroke="var(--guide-marcus)" strokeWidth={2.5} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">
              Daily mood scores range from {Math.min(...points.map((point) => point.sentiment_score)).toFixed(2)} to {Math.max(...points.map((point) => point.sentiment_score)).toFixed(2)}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function GuideChart({ distribution }: { distribution: InsightsResponse["guide_distribution"] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Perspective distribution</CardTitle></CardHeader>
      <CardContent>
        {distribution.length === 0 ? (
          <p className="py-12 text-center text-sm leading-6 text-muted-foreground">Perspective patterns appear after matched check-ins.</p>
        ) : (
          <>
            <div aria-label="Check-in count by guide" className="h-64" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={distribution} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis allowDecimals={false} type="number" />
                  <YAxis dataKey="name" type="category" width={104} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {distribution.map((guide, index) => (
                      <Cell fill={guideColors[index % guideColors.length]} key={guide.guide_id} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="sr-only">
              {distribution.map((guide) => <li key={guide.guide_id}>{guide.name}: {guide.count} check-ins</li>)}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsCharts({ data }: { data: InsightsResponse }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <MoodChart points={data.mood_points} />
      <GuideChart distribution={data.guide_distribution} />
    </div>
  );
}
