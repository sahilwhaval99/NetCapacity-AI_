import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import AlertsAndSettingsPage from './AlertsAndSettingsPage.jsx';
import CapacityPlannerPage from './CapacityPlannerPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import DatasetManagerPage from './DatasetManagerPage.jsx';
import ForecastExplorerPage from './ForecastExplorerPage.jsx';
import ModelEvaluationPage from './ModelEvaluationPage.jsx';
import { fetchDashboard } from './api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [horizon, setHorizon] = useState('24h');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(
    async (targetHorizon = horizon) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchDashboard(targetHorizon);
        setDashboardData(data);
        if (data?.forecast?.horizon && data.forecast.horizon !== targetHorizon) {
          setHorizon(data.forecast.horizon);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          'FastAPI backend offline at http://127.0.0.1:8000. Start it via `python3 main.py` inside backend/.'
        );
      } finally {
        setLoading(false);
      }
    },
    [horizon]
  );

  useEffect(() => {
    loadDashboard(horizon);
  }, [loadDashboard, horizon]);

  const unacknowledgedAlerts = (dashboardData?.alerts || []).filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#02070A] text-slate-100 flex flex-col md:flex-row selection:bg-[#0297DE]/30 selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unacknowledgedAlerts={unacknowledgedAlerts}
        activeDataset={dashboardData?.active_dataset}
        horizon={horizon}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FC734D]/15 border border-[#FC734D]/40 text-xs text-[#FC734D] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#FC734D] shrink-0" />
            <div>
              <p className="font-bold text-sm text-white">Backend Connection Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            dashboardData={dashboardData}
            horizon={horizon}
            onHorizonChange={(h) => setHorizon(h)}
            onNavigate={(tab) => setActiveTab(tab)}
            onRefresh={() => loadDashboard(horizon)}
            loading={loading}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastExplorerPage
            initialHorizon={horizon}
            initialGrowth={dashboardData?.settings?.expected_user_growth_pct ?? 12.0}
            activeDataset={dashboardData?.active_dataset}
          />
        )}

        {activeTab === 'capacity' && (
          <CapacityPlannerPage
            initialPlan={dashboardData?.capacity_plan}
            activeDataset={dashboardData?.active_dataset}
            onPlanSaved={() => loadDashboard(horizon)}
          />
        )}

        {activeTab === 'evaluation' && (
          <ModelEvaluationPage
            activeDataset={dashboardData?.active_dataset}
            onModelRetrained={() => loadDashboard(horizon)}
          />
        )}

        {activeTab === 'datasets' && (
          <DatasetManagerPage onDatasetChanged={() => loadDashboard(horizon)} />
        )}

        {activeTab === 'settings' && (
          <AlertsAndSettingsPage onSettingsUpdated={() => loadDashboard(horizon)} />
        )}
      </main>
    </div>
  );
}
