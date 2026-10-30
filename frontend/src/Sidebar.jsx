import React from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Download,
  Gauge,
  Network,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { getCapacityCsvUrl, getForecastCsvUrl } from './api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Analytics Dashboard', icon: Activity, badge: null },
  { id: 'forecast', label: 'Forecast Explorer', icon: TrendingUp, badge: '24h/7d/30d' },
  { id: 'capacity', label: 'Capacity Planner', icon: Gauge, badge: 'Simulator' },
  { id: 'evaluation', label: 'Model Evaluation', icon: Cpu, badge: 'RF vs Naive' },
  { id: 'datasets', label: 'Dataset Manager', icon: Database, badge: 'CSV Upload' },
  { id: 'settings', label: 'Alerts & Settings', icon: Settings, badge: null },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  unacknowledgedAlerts = 0,
  activeDataset,
  horizon = '24h',
}) {
  return (
    <aside className="w-full md:w-72 shrink-0 bg-[#040B12]/95 border-b md:border-b-0 md:border-r border-[#0297DE]/20 flex flex-col justify-between min-h-screen select-none backdrop-blur-md">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#0297DE]/15 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0297DE] to-[#FC734D] p-0.5 shadow-lg shadow-[#0297DE]/25">
            <div className="w-full h-full bg-[#02070A] rounded-[10px] flex items-center justify-center">
              <Network className="w-5 h-5 text-[#0297DE]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                NetCapacity<span className="text-[#FC734D]">.AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#0297DE]/15 text-[#0297DE] border border-[#0297DE]/30 font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent Bandwidth Planning</p>
          </div>
        </div>

        {/* Active Dataset Pill */}
        {activeDataset && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-[#07131F]/90 border border-[#0297DE]/25">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold">Active Telemetry</span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                  activeDataset.is_synthetic
                    ? 'bg-[#FC734D]/15 text-[#FC734D] border-[#FC734D]/35'
                    : 'bg-[#0297DE]/15 text-[#0297DE] border-[#0297DE]/35'
                }`}
              >
                {activeDataset.is_synthetic ? 'SYNTHETIC' : 'UPLOADED CSV'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate" title={activeDataset.name}>
              {activeDataset.name}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{activeDataset.row_count} rows</span>
              <span className="uppercase text-[#0297DE] font-semibold">{activeDataset.frequency}</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showAlertCount = item.id === 'settings' && unacknowledgedAlerts > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0297DE] to-[#0284C7] text-white shadow-md shadow-[#0297DE]/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#07131F]/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {showAlertCount ? (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-[#FC734D]/25 text-[#FC734D] border border-[#FC734D]/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {unacknowledgedAlerts}
                  </span>
                ) : item.badge ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#07131F] text-slate-400 border border-[#0297DE]/20">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Quick Report Exports */}
        <div className="px-4 mt-3">
          <div className="p-3.5 rounded-xl bg-[#07131F]/80 border border-[#0297DE]/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Download className="w-3.5 h-3.5 text-[#FC734D]" />
              <span>Export CSV Reports</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <a
                href={getForecastCsvUrl(horizon)}
                download
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#040B12] hover:bg-[#0D1E30] text-xs text-slate-200 border border-[#0297DE]/25 transition"
              >
                <span>Forecast Series ({horizon.toUpperCase()})</span>
                <span className="font-mono text-[10px] text-[#0297DE] font-bold">.CSV</span>
              </a>
              <a
                href={getCapacityCsvUrl(horizon)}
                download
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#040B12] hover:bg-[#0D1E30] text-xs text-slate-200 border border-[#FC734D]/25 transition"
              >
                <span>Executive Capacity Audit</span>
                <span className="font-mono text-[10px] text-[#FC734D] font-bold">.CSV</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Academic Credit */}
      <div className="p-4 border-t border-[#0297DE]/15 bg-[#02070A]/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-300">B.Tech AI & DS Project</p>
            <p className="text-[11px] text-slate-500 font-mono">Random Forest Lag Forecasting</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
