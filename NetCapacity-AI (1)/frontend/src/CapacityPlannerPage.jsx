import React, { useEffect, useState } from 'react';
import {
  Download,
  Gauge,
  Play,
  Save,
  Server,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCapacityCsvUrl, runCapacityPlan } from './api';

const QUICK_TIERS = [500, 1000, 2500, 5000, 10000];

export default function CapacityPlannerPage({
  initialPlan,
  activeDataset,
  onPlanSaved,
}) {
  const params = initialPlan?.parameters || {
    allocated_bandwidth_mbps: 1000,
    utilization_threshold_pct: 80,
    expected_user_growth_pct: 12,
    safety_headroom_pct: 15,
    horizon: '24h',
  };

  const [allocatedMbps, setAllocatedMbps] = useState(params.allocated_bandwidth_mbps);
  const [thresholdPct, setThresholdPct] = useState(params.utilization_threshold_pct);
  const [userGrowthPct, setUserGrowthPct] = useState(params.expected_user_growth_pct);
  const [headroomPct, setHeadroomPct] = useState(params.safety_headroom_pct);
  const [horizon, setHorizon] = useState(params.horizon || '24h');
  const [planResult, setPlanResult] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (initialPlan) {
      setPlanResult(initialPlan);
      setAllocatedMbps(initialPlan.parameters.allocated_bandwidth_mbps);
      setThresholdPct(initialPlan.parameters.utilization_threshold_pct);
      setUserGrowthPct(initialPlan.parameters.expected_user_growth_pct);
      setHeadroomPct(initialPlan.parameters.safety_headroom_pct);
    }
  }, [initialPlan]);

  const handleSimulate = async (persist = false) => {
    setLoading(true);
    setSaveMessage('');
    try {
      const res = await runCapacityPlan({
        allocated_bandwidth_mbps: Number(allocatedMbps),
        utilization_threshold_pct: Number(thresholdPct),
        expected_user_growth_pct: Number(userGrowthPct),
        safety_headroom_pct: Number(headroomPct),
        horizon,
        persist_settings: persist,
      });
      setPlanResult(res.capacity_plan);
      if (persist) {
        setSaveMessage('Capacity parameters saved to SQLite database.');
        if (onPlanSaved) onPlanSaved();
      }
    } catch (err) {
      console.error('Capacity simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!planResult) return null;

  const p = planResult.parameters;
  const hMetrics = planResult.historical_metrics;
  const fMetrics = planResult.forecast_metrics;
  const gap = planResult.capacity_gap_analysis;
  const recTier = planResult.recommended_upgrade_tier;

  const comparisonChartData = [
    { name: 'Hist Peak', mbps: hMetrics.peak_mbps, color: '#3B82F6' },
    { name: 'Base ML', mbps: fMetrics.base_peak_mbps, color: '#0284C7' },
    { name: 'Forecast Peak', mbps: fMetrics.growth_adjusted_peak_mbps, color: '#0297DE' },
    { name: '90% Burst', mbps: fMetrics.upper_90_peak_mbps, color: '#FC734D' },
    { name: 'SLA Ceiling', mbps: p.effective_sla_ceiling_mbps, color: '#10B981' },
    { name: 'Alloc Link', mbps: p.allocated_bandwidth_mbps, color: '#6366F1' },
    { name: 'Req Target', mbps: gap.required_link_capacity_mbps, color: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      <!-- Header -->
      <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-[#FC734D]" />
            <span>Interactive Network Capacity Planner & Upgrade Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate link bandwidth, SLA utilization ceilings, and traffic growth to compute exact capacity deficits in real time.
          </p>
        </div>

        <a
          href={getCapacityCsvUrl(horizon)}
          download
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0297DE]/20 to-[#FC734D]/20 hover:from-[#0297DE]/30 hover:to-[#FC734D]/30 border border-[#FC734D]/40 text-xs font-semibold text-white transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#FC734D]" />
          <span>Export Capacity Audit CSV</span>
        </a>
      </div>

      <!-- Main Layout: Controls & Real-Time Results -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left Slider Controls -->
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold pb-2 border-b border-slate-800">
            1. Network Infrastructure & SLA Parameters
          </h2>

          <!-- Allocated Bandwidth -->
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label className="font-medium text-slate-300">Allocated Link Bandwidth</label>
              <span className="font-mono font-bold text-[#0297DE]">{allocatedMbps} Mbps</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={allocatedMbps}
              onChange={(e) => setAllocatedMbps(Number(e.target.value))}
              className="w-full accent-[#0297DE] cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setAllocatedMbps(tier)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition ${
                    Number(allocatedMbps) === tier
                      ? 'bg-[#0297DE] text-white border-[#0297DE]'
                      : 'bg-[#040B12] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {tier >= 1000 ? `${tier / 1000}G` : `${tier}M`}
                </button>
              ))}
            </div>
          </div>

          <!-- SLA Utilization Threshold -->
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-slate-300">SLA Max Utilization Threshold</label>
              <span className="font-mono font-bold text-[#FC734D]">
                {thresholdPct}% ({Math.round((allocatedMbps * thresholdPct) / 100)} Mbps Ceiling)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={thresholdPct}
              onChange={(e) => setThresholdPct(Number(e.target.value))}
              className="w-full accent-[#FC734D] cursor-pointer"
            />
          </div>

          <!-- Expected User Growth -->
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-slate-300">Expected User / Traffic Growth</label>
              <span className="font-mono font-bold text-white">
                {userGrowthPct >= 0 ? `+${userGrowthPct}%` : `${userGrowthPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="100"
              step="5"
              value={userGrowthPct}
              onChange={(e) => setUserGrowthPct(Number(e.target.value))}
              className="w-full accent-[#0297DE] cursor-pointer"
            />
          </div>

          <!-- Safety Burst Headroom Buffer -->
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-slate-300">Safety Burst Headroom Buffer</label>
              <span className="font-mono font-bold text-emerald-400">+{headroomPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={headroomPct}
              onChange={(e) => setHeadroomPct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <!-- Action Buttons -->
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSimulate(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#040B12] hover:bg-[#0D1E30] text-[#0297DE] border border-[#0297DE]/40 font-semibold text-xs transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loading ? 'Running...' : 'Simulate'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSimulate(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FC734D] hover:bg-[#EA580C] text-[#02070A] font-bold text-xs transition shadow-md shadow-[#FC734D]/25"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Plan</span>
            </button>
          </div>

          {saveMessage && (
            <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-center">
              {saveMessage}
            </p>
          )}
        </div>

        <!-- Right Side: Results & Benchmark Charts -->
        <div className="lg:col-span-7 space-y-6">
          
          <!-- Capacity Gap Cards -->
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Effective SLA Ceiling</span>
              <p className="text-xl font-bold font-mono text-white mt-1">{p.effective_sla_ceiling_mbps} Mbps</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{p.allocated_bandwidth_mbps}M × {p.utilization_threshold_pct}%</p>
            </div>

            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Forecast Demand</span>
              <p className="text-xl font-bold font-mono text-[#0297DE] mt-1">{fMetrics.growth_adjusted_peak_mbps} Mbps</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fMetrics.peak_utilization_pct}% of link</p>
            </div>

            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">SLA Capacity Gap</span>
              <p className={`text-xl font-bold font-mono mt-1 ${gap.sla_capacity_gap_mbps > 0 ? 'text-[#FC734D]' : 'text-emerald-400'}`}>
                {gap.sla_capacity_gap_mbps > 0 ? `+${gap.sla_capacity_gap_mbps} Mbps` : '0 Mbps (Safe)'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{gap.sla_breach_intervals_count} breach intervals</p>
            </div>

            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Required Target Bandwidth</span>
              <p className="text-xl font-bold font-mono text-pink-400 mt-1">{gap.required_link_capacity_mbps} Mbps</p>
              <p className="text-[10px] text-slate-500 mt-0.5">With +{p.safety_headroom_pct}% headroom</p>
            </div>

            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Expansion Needed</span>
              <p className="text-xl font-bold font-mono text-white mt-1">+{gap.additional_bandwidth_needed_mbps} Mbps</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Above current link</p>
            </div>

            <div className="p-4 rounded-xl bg-[#040B12] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Recommended Tier</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{recTier.tier_mbps} Mbps</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Est. ${recTier.typical_monthly_usd}/mo</p>
            </div>
          </div>

          <!-- Comparison Bar Chart -->
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">
              Bandwidth Demand vs. SLA Ceiling & Required Capacity (Mbps)
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D1E30" />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} unit=" M" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#040B12',
                      borderColor: '#0297DE',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="mbps" name="Bandwidth (Mbps)" radius={[6, 6, 0, 0]}>
                    {comparisonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <!-- Recommended Tier Card -->
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#040B12] to-[#07131F] border border-[#FC734D]/35 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#FC734D] font-bold">Recommended Optical Hardware</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{recTier.label}</h4>
              <p className="text-xs text-[#0297DE] font-mono mt-0.5">{recTier.interface_spec}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Estimated Circuit OpEx</span>
              <p className="text-lg font-bold font-mono text-[#FC734D]">${recTier.typical_monthly_usd.toLocaleString()}/mo</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
