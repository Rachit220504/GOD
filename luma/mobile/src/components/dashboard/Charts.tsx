import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
  title?: string;
}

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  title?: string;
  unit?: string;
}

interface MultiLineChartProps {
  data: { label: string; phonics: number; fluency: number; comprehension: number }[];
  height?: number;
}

// ─── Bar Chart (pure RN — no SVG dep needed) ──────────────────────────────────

export function BarChart({ data, maxValue, height = 120, title }: BarChartProps) {
  if (!data.length) return null;
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={[styles.barArea, { height }]}>
        {data.map((item, i) => {
          const barH = Math.max(4, (item.value / max) * (height - 32));
          return (
            <View key={i} style={styles.barCol}>
              {item.value > 0 && (
                <Text style={styles.barValueLabel}>{item.value}</Text>
              )}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: item.color ?? Colors.purple,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Line Chart (pure RN using View segments) ─────────────────────────────────

export function LineChart({ data, color = Colors.purple, height = 100, title, unit = '' }: LineChartProps) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const chartW = SCREEN_W - Spacing.screen * 4 - Spacing.xl * 2;
  const segW = chartW / (data.length - 1);

  // Compute normalised Y positions
  const points = values.map((v) => ({
    x: 0,
    y: height - ((v - min) / range) * (height - 20) - 10,
    value: v,
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}

      {/* Y-axis labels */}
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{max}{unit}</Text>
          <Text style={styles.yLabel}>{Math.round((max + min) / 2)}{unit}</Text>
          <Text style={styles.yLabel}>{min}{unit}</Text>
        </View>

        {/* Chart area with segments */}
        <View style={[styles.lineArea, { height, flex: 1 }]}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((f, i) => (
            <View key={i} style={[styles.gridLine, { top: f * (height - 8) }]} />
          ))}

          {/* Segments between points */}
          {points.slice(0, -1).map((pt, i) => {
            const nextPt = points[i + 1]!;
            const dx = segW;
            const dy = nextPt.y - pt.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const length = Math.sqrt(dx * dx + dy * dy);

            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: i * segW,
                  top: pt.y,
                  width: length,
                  height: 3,
                  backgroundColor: color,
                  borderRadius: 1.5,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 50%',
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* Dots */}
          {points.map((pt, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: i * segW - 5,
                  top: pt.y - 5,
                  backgroundColor: color,
                  borderColor: Colors.white,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxis, { marginLeft: 32 }]}>
        {data.map((d, i) => (
          <Text key={i} style={styles.xLabel} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Multi-Line Skill Trend Chart ─────────────────────────────────────────────

export function SkillTrendChart({ data, height = 120 }: MultiLineChartProps) {
  if (data.length < 2) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>Not enough data yet — keep reading! 📖</Text>
      </View>
    );
  }

  const LINES: { key: keyof typeof data[0]; color: string; label: string }[] = [
    { key: 'phonics', color: Colors.purple, label: 'Phonics' },
    { key: 'fluency', color: Colors.orange, label: 'Fluency' },
    { key: 'comprehension', color: Colors.success, label: 'Comprehension' },
  ];

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        {LINES.map((line) => (
          <View key={line.key as string} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <Text style={styles.legendLabel}>{line.label}</Text>
          </View>
        ))}
      </View>

      {/* Charts stacked as mini bars per session */}
      <View style={[styles.lineArea, { height, flexDirection: 'row', alignItems: 'flex-end' }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.multiBarGroup}>
            {LINES.map((line) => {
              const val = d[line.key] as number;
              const barH = Math.max(2, (val / 100) * (height - 16));
              return (
                <View
                  key={line.key as string}
                  style={[styles.multiBar, { height: barH, backgroundColor: line.color }]}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.xAxis, { marginLeft: 0 }]}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.xLabel, { flex: 1 }]} numberOfLines={1}>
            {d.label.slice(5)} {/* show MM-DD only */}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Weekly Activity Mini-Chart ───────────────────────────────────────────────

export function WeeklyMiniChart({ data }: { data: { date: string; minutes: number }[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <View style={styles.weeklyRow}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.minutes / max) * 64);
        const day = new Date(d.date).getDay();
        const isToday = d.date === new Date().toISOString().split('T')[0];
        return (
          <View key={i} style={styles.weeklyCol}>
            {d.minutes > 0 && (
              <Text style={styles.weeklyVal}>{d.minutes}m</Text>
            )}
            <View style={[styles.weeklyBar, { height: h, backgroundColor: isToday ? Colors.purple : Colors.purpleLight }]} />
            <Text style={[styles.weeklyDay, isToday && styles.weeklyDayToday]}>
              {days[day]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { width: '100%' },
  chartTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Bar chart
  barArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  barTrack: { width: '80%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barValueLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  barLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '500', textAlign: 'center' },

  // Line chart
  lineArea: { position: 'relative', overflow: 'hidden' },
  yAxis: { width: 32, justifyContent: 'space-between', paddingVertical: 4 },
  yLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'right' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border, opacity: 0.5 },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  xLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  // Multi-line
  legend: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  multiBarGroup: { flex: 1, flexDirection: 'row', gap: 2, alignItems: 'flex-end', paddingHorizontal: 2 },
  multiBar: { flex: 1, borderRadius: 3, borderTopLeftRadius: 4, borderTopRightRadius: 4 },

  // Weekly
  weeklyRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 },
  weeklyCol: { flex: 1, alignItems: 'center', gap: 3 },
  weeklyVal: { fontSize: 8, color: Colors.textMuted, fontWeight: '600' },
  weeklyBar: { width: 20, borderRadius: 4, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  weeklyDay: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  weeklyDayToday: { color: Colors.purple, fontWeight: '800' },

  // Empty
  emptyChart: { padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.softBlue, borderRadius: BorderRadius.lg },
  emptyChartText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
