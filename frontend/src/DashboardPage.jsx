import React from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Download,
  Gauge,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getForecastCsvUrl } from './api';

const STATUS_BADGE_STYLES = {
  CRITICAL_SHORTAGE: 'bg-[#FC734D]/20 text-[#FC734D] border-[#FC734D]/50',
  SLA_THRESHOLD_BREACH: 'bg-[#FC734D]/20 text-[#FC734D] border-[#FC734D]/50',
  NEAR_CAPACITY_WATCH: 'bg-[#FC734D]/15 text-[#FF8A65] border-[#FC734D]/30',
  OVERPROVISIONED: 'bg-[#0297DE]/15 text-[#0297DE] border-[#0297DE]/30',
  HEALTHY_OPTIMAL: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

export default function DashboardPage({
  dashboardData,
  horizon,
  onHorizonChange,
  onNavigate,
  onRefresh,
  loading,
}) {
  if (!dashboardData) return null;

  const {
    organization_name,
    active_dataset,
    capacity_plan,
    forecast,
    model_metrics,
    engine_used,
    seasonality_profile,
    alerts,
  } = dashboardData;

  const params = capacity_plan.parameters;
  const histMetrics = capacity_plan.historical_metrics;
  const forecastMetrics = capacity_plan.forecast_metrics;
  const gap = capacity_plan.capacity_gap_analysis;
  const recTier = capacity_plan.recommended_upgrade_tier;
  const rfTest = model_metrics.random_forest_test;
  const supportedHorizons = forecast.supported_horizons || ['24h', '7d', '30d'];

  const unifiedSeries = [
    ...forecast.historical_context.map((pt) => ({
      timestamp: pt.timestamp,
      historical_mbps: pt.actual_mbps,
      predicted_mbps: null,
      upper_bound_mbps: null,
    })),
    ...forecast.forecast_series.map((pt) => ({
      timestamp: pt.timestamp,
      historical_mbps: null,
      predicted_mbps: pt.predicted_mbps,
      upper_bound_mbps: pt.upper_bound_mbps,
    })),
  ];

  const unackAlerts = (alerts || []).filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <!-- Top Atmospheric Hero Banner -->
      <div className="relative text-center py-6 sm:py-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#07131F]/90 border border-[#0297DE]/30 text-xs text-slate-300 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#0297DE] animate-ping"></span>
          <span>{organization_name}</span>
          <span className="text-[#FC734D] font-mono font-bold">• Zero Data Leakage</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Plan Network Capacity at the <span className="font-display italic text-transparent bg-clip-text bg-gradient-to-r from-[#0297DE] to-[#FC734D] font-normal">Speed of Thought.</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
          Random Forest lag forecasting benchmarked against Persistence & Seasonal baselines for predictive infrastructure scaling.
        </p>
      </div>

      <!-- Header Filter & Controls -->
      <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0297DE]/15 text-[#0297DE] border border-[#0297DE]/30">
            {active_dataset.name}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FC734D]/15 text-[#FC734D] border border-[#FC734D]/30">
            {active_dataset.row_count} rows ({active_dataset.frequency})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#040B12] p-1 rounded-xl border border-[#0297DE]/30">
            {['24h', '7d', '30d'].map((h) => {
              const supported = supportedHorizons.includes(h);
              const active = horizon === h;
              return (
                <button
                  key={h}
                  disabled={!supported}
                  onClick={() => supported && onHorizonChange(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    active
                      ? 'bg-gradient-to-r from-[#0297DE] to-[#0284C7] text-white shadow-sm'
                      : supported
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {h.toUpperCase()}
                </button>
              );
            })}
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-[#07131F] hover:bg-[#0D1E30] text-slate-300 border border-[#0297DE]/30 transition"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0297DE]' : ''}`} />
          </button>

          <a
            href={getForecastCsvUrl(horizon)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0297DE]/20 to-[#FC734D]/20 hover:from-[#0297DE]/30 hover:to-[#FC734D]/30 text-xs font-semibold text-white border border-[#0297DE]/30 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#FC734D]" />
            <span>CSV</span>
          </a>
        </div>
      </div>

      <!-- 4 Primary KPI Cards -->
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Historical Peak */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0297DE] to-transparent"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Historical Peak Load</span>
            <Wifi className="w-4 h-4 text-[#0297DE]" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white">{histMetrics.peak_mbps}</span>
              <span className="text-xs font-mono text-slate-400">Mbps</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Avg: <strong className="text-slate-200 font-mono">{histMetrics.avg_mbps} Mbps</strong> • P95: <strong className="text-slate-200 font-mono">{histMetrics.p95_mbps} Mbps</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-mono text-slate-400">
            <span>Allocated Link:</span>
            <span className="text-[#0297DE] font-semibold">{params.allocated_bandwidth_mbps} Mbps</span>
          </div>
        </div>

        {/* KPI 2: Forecast Peak */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0297DE] to-[#FC734D]"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Projected Peak ({forecast.horizon.toUpperCase()})</span>
            <TrendingUp className="w-4 h-4 text-[#0297DE]" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-[#0297DE]">{forecastMetrics.growth_adjusted_peak_mbps}</span>
              <span className="text-xs font-mono text-slate-400">Mbps</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Base ML: {forecastMetrics.base_peak_mbps} M (+{params.expected_user_growth_pct}% growth)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-mono text-slate-400">
            <span>90% Upper Burst:</span>
            <span className="text-[#FC734D] font-semibold">{forecastMetrics.upper_90_peak_mbps} Mbps</span>
          </div>
        </div>

        {/* KPI 3: SLA Capacity Gap */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FC734D] to-transparent"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold">SLA Capacity Gap ({params.utilization_threshold_pct}%)</span>
            <Gauge className="w-4 h-4 text-[#FC734D]" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-extrabold font-mono ${gap.sla_capacity_gap_mbps > 0 ? 'text-[#FC734D]' : 'text-[#0297DE]'}`}>
                {gap.sla_capacity_gap_mbps > 0 ? `+${gap.sla_capacity_gap_mbps} Mbps Deficit` : `${Math.abs(gap.available_sla_margin_mbps)} Mbps Margin`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              SLA Ceiling: <strong className="text-slate-200 font-mono">{params.effective_sla_ceiling_mbps} Mbps</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between items-center">
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${STATUS_BADGE_STYLES[gap.status] || STATUS_BADGE_STYLES.HEALTHY_OPTIMAL}`}>
              {gap.status_label}
            </span>
            <button onClick={() => onNavigate('capacity')} className="text-[#0297DE] hover:underline text-xs font-semibold">
              Plan Upgrade →
            </button>
          </div>
        </div>

        {/* KPI 4: Random Forest Accuracy */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0297DE] to-emerald-400"></div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold">Random Forest Accuracy</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">R² = {rfTest.r2.toFixed(4)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              RMSE: {rfTest.rmse} Mbps • MAE: {rfTest.mae} Mbps
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between font-mono text-slate-400">
            <span>vs. Persistence:</span>
            <span className="text-[#0297DE] font-semibold">+{model_metrics.rmse_improvement_over_persistence_pct}% Lower Error</span>
          </div>
        </div>
      </div>

      <!-- Unified Main Timeline Chart -->
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0297DE]"></span>
              <span>Observed Network Telemetry vs. Random Forest Forecast ({forecast.horizon.toUpperCase()})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Growth-adjusted demand forecast, 90% confidence burst envelope, and SLA capacity ceilings.
            </p>
          </div>
        </div>

        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={unifiedSeries} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="burstArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FC734D" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FC734D" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0D1E30" />
              <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} minTickGap={35} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} unit=" M" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#040B12',
                  borderColor: 'rgba(2, 151, 222, 0.4)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#FFFFFF',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />

              <ReferenceLine
                y={params.allocated_bandwidth_mbps}
                stroke="#F43F5E"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{ value: `Physical Link (${params.allocated_bandwidth_mbps}M)`, fill: '#F43F5E', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine
                y={params.effective_sla_ceiling_mbps}
                stroke="#FC734D"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ value: `SLA Ceiling (${params.effective_sla_ceiling_mbps}M)`, fill: '#FC734D', fontSize: 10, position: 'insideBottomRight' }}
              />

              <Area type="monotone" dataKey="upper_bound_mbps" name="90% Upper Burst Envelope" stroke="none" fill="url(#burstArea)" />
              <Line type="monotone" dataKey="historical_mbps" name="Observed Telemetry (Mbps)" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="predicted_mbps" name="RF Forecast Demand (Mbps)" stroke="#0297DE" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <!-- Bottom Row: Hardware Upgrade Recommendation & Seasonality Profile -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Hardware Upgrade -->
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#FC734D]" />
                <h3 className="text-sm font-bold text-white">Recommended Carrier Infrastructure Upgrade</h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#FC734D]/15 text-[#FC734D] border border-[#FC734D]/35 font-semibold">
                Target: {gap.required_link_capacity_mbps} Mbps
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-[#040B12] border border-[#0297DE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Carrier Optical Circuit Tier</span>
                <h4 className="text-base font-bold text-white mt-0.5">{recTier.label}</h4>
                <p className="text-xs text-[#0297DE] font-mono mt-0.5">{recTier.interface_spec}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Est. Monthly Circuit OpEx</span>
                <p className="text-xl font-bold font-mono text-[#FC734D]">${recTier.typical_monthly_usd.toLocaleString()}/mo</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {capacity_plan.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#040B12] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-white">{rec.title}</strong>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-[#0297DE]">{rec.priority}</span>
                  </div>
                  <span className="text-slate-400 mt-1 block">{rec.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Test custom bandwidth & growth sliders in real-time</span>
            <button
              onClick={() => onNavigate('capacity')}
              className="px-4 py-2 rounded-xl bg-[#0297DE] hover:bg-[#0284C7] text-white font-semibold text-xs shadow-md shadow-[#0297DE]/25 transition"
            >
              Open Capacity Simulator →
            </button>
          </div>
        </div>

        <!-- Diurnal Seasonality Profile -->
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0297DE]" />
                <span>Diurnal Traffic Seasonality</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Mean vs Peak</span>
            </div>
            <p className="text-xs text-slate-400 my-2">Bandwidth distribution across cycle hours:</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonality_profile} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D1E30" />
                  <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 9, fill: '#94A3B8' }} unit=" M" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#040B12',
                      borderColor: '#0297DE',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="avg_mbps" name="Mean (Mbps)" fill="#0297DE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="peak_mbps" name="Peak (Mbps)" fill="#FC734D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Business Hours: <strong className="text-[#FC734D]">09:00–17:00</strong></span>
            <span>Trough: <strong className="text-[#0297DE]">02:00–05:00</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
