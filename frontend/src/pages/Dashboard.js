import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { amcService, authService, inventoryService } from '../services/api';

const Dashboard = () => {
  const [amcs, setAmcs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({
    totalMachines: 0,
    totalSpareParts: 0,
    lowStockCount: 0,
    categoriesCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [amcRes, schedulesRes, paymentRes, inventoryStatsRes, machinesRes] = await Promise.all([
        amcService.getAmcs(),
        amcService.getSchedules(),
        amcService.getPayments(),
        inventoryService.getStats(),
        inventoryService.getMachines(),
      ]);

      setAmcs(amcRes.data || []);
      setSchedules(schedulesRes.data || []);
      setPayments(paymentRes.data || []);

      const machines = machinesRes.data || [];
      const categoriesCount = new Set(
        machines
          .map((item) => (item.category || '').trim())
          .filter((item) => item.length > 0)
      ).size;

      setInventoryStats({
        totalMachines: inventoryStatsRes.data?.totalMachines || 0,
        totalSpareParts: inventoryStatsRes.data?.totalSpareParts || 0,
        lowStockCount: inventoryStatsRes.data?.lowStockCount || 0,
        categoriesCount,
      });
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        authService.logout();
        navigate('/login');
        return;
      }
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const parseDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const dueThisMonth = schedules.filter((item) => {
      const date = parseDate(item.scheduledDate);
      return date && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const overdueServices = schedules.filter((item) => item.status === 'OVERDUE').length;

    const amcExpiringSoon = amcs.filter((item) => {
      const endDate = parseDate(item.endDate);
      if (!endDate) return false;
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const outstandingPayments = payments.filter((payment) => {
      const status = payment.status;
      return status === 'UNPAID' || status === 'PARTIALLY_PAID' || status === 'OVERDUE';
    }).length;

    return {
      dueThisMonth,
      overdueServices,
      amcExpiringSoon,
      outstandingPayments,
    };
  }, [amcs, schedules, payments]);

  const upcomingServices = useMemo(() => {
    const today = new Date();
    return schedules
      .filter((item) => item.status !== 'COMPLETED' && item.scheduledDate)
      .map((item) => ({
        ...item,
        parsedDate: new Date(item.scheduledDate),
      }))
      .filter((item) => !Number.isNaN(item.parsedDate.getTime()) && item.parsedDate >= today)
      .sort((a, b) => a.parsedDate - b.parsedDate)
      .slice(0, 10);
  }, [schedules]);

  const dashboardHealth = useMemo(() => {
    const completedServices = schedules.filter((item) => item.status === 'COMPLETED').length;
    const totalServices = schedules.length;
    const completionRate = totalServices > 0
      ? Math.round((completedServices / totalServices) * 100)
      : 0;

    const activeAmcs = amcs.filter((item) => item.status === 'ACTIVE').length;
    const healthyPayments = payments.filter((item) => item.status === 'PAID').length;
    const paymentCoverage = payments.length > 0
      ? Math.round((healthyPayments / payments.length) * 100)
      : 0;

    return {
      completedServices,
      totalServices,
      completionRate,
      activeAmcs,
      paymentCoverage,
    };
  }, [amcs, schedules, payments]);

  const statCards = [
    {
      key: 'due',
      label: 'Services Due This Month',
      value: dashboardStats.dueThisMonth,
      helper: 'Scheduled workload this month',
      tone: 'tone-primary',
      accent: 'SV',
    },
    {
      key: 'overdue',
      label: 'Overdue Services',
      value: dashboardStats.overdueServices,
      helper: 'Needs immediate scheduling',
      tone: 'tone-danger',
      accent: 'OD',
    },
    {
      key: 'expiring',
      label: 'AMC Expiring Soon',
      value: dashboardStats.amcExpiringSoon,
      helper: 'Expiring within 30 days',
      tone: 'tone-warning',
      accent: 'AMC',
    },
    {
      key: 'payments',
      label: 'Outstanding Payments',
      value: dashboardStats.outstandingPayments,
      helper: 'Pending financial follow-up',
      tone: 'tone-accent',
      accent: 'PM',
    },
  ];

  const healthSignals = [
    {
      label: 'Service Completion',
      value: `${dashboardHealth.completionRate}%`,
      progress: dashboardHealth.completionRate,
      tone: 'primary',
    },
    {
      label: 'Payment Coverage',
      value: `${dashboardHealth.paymentCoverage}%`,
      progress: dashboardHealth.paymentCoverage,
      tone: 'accent',
    },
  ];

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <span className="hero-pill">Operations Command Center</span>
          <h1>Dashboard</h1>
          <p>
            Track services, AMC health, and payments in one place with actionable status signals.
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate('/amc-management')}>
            Open AMC Management
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/services')}>
            Review Services
          </button>
        </div>
      </section>

      {error && <div className="error-msg">{error}</div>}

      {loading && (
        <div className="data-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          Loading dashboard data...
        </div>
      )}

      <div className="summary-grid">
        {statCards.map((card) => (
          <article className={`summary-card ${card.tone}`} key={card.key}>
            <div className="summary-card-top">
              <div className="summary-card-label">{card.label}</div>
              <span className="summary-accent">{card.accent}</span>
            </div>
            <div className="summary-card-value">{card.value}</div>
            <div className="summary-card-helper">{card.helper}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="data-card dashboard-table-card">
          <div className="widget-header">
            <h3>Upcoming Services</h3>
            <button className="btn btn-outline btn-small" onClick={() => navigate('/services')}>
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="company-header">Company</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingServices.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No upcoming services in the schedule.
                    </td>
                  </tr>
                ) : (
                  upcomingServices.map((service) => (
                    <tr key={service.id} className="clickable-row" onClick={() => navigate('/services')}>
                      <td className="company-cell">
                        <div className="machine-cell">
                          <span className="machine-name">{service.amcContract?.companyName || 'Unknown Company'}</span>
                        </div>
                      </td>
                      <td>{service.scheduledDate || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${
                          service.status === 'COMPLETED' ? 'status-active' :
                          service.status === 'OVERDUE' ? 'status-expired' : 'status-pending'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="data-card dashboard-insights-card">
          <div className="widget-header widget-header-tight">
            <h3>Operational Health</h3>
          </div>
          <div className="insights-body">
            <div className="insight-highlights">
              <div>
                <div className="insight-number">{dashboardHealth.completedServices}</div>
                <div className="insight-label">Completed Services</div>
              </div>
              <div>
                <div className="insight-number">{dashboardHealth.activeAmcs}</div>
                <div className="insight-label">Active AMCs</div>
              </div>
            </div>

            <div className="signal-list">
              {healthSignals.map((signal) => (
                <div className="signal-row" key={signal.label}>
                  <div className="signal-head">
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                  <div className="signal-track">
                    <div
                      className={`signal-fill ${signal.tone}`}
                      style={{ width: `${Math.max(0, Math.min(100, signal.progress))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/payments')}>
              Open Payments Center
            </button>

            <section className="inventory-pulse-card">
              <div className="inventory-pulse-title">Inventory Pulse</div>
              <div className="inventory-pulse-grid">
                <article className="inventory-pulse-item">
                  <div className="inventory-pulse-label">Total machines</div>
                  <div className="inventory-pulse-value">{inventoryStats.totalMachines}</div>
                </article>
                <article className="inventory-pulse-item">
                  <div className="inventory-pulse-label">Spare parts</div>
                  <div className="inventory-pulse-value">{inventoryStats.totalSpareParts}</div>
                </article>
                <article className="inventory-pulse-item">
                  <div className="inventory-pulse-label">Low stock alerts</div>
                  <div className={`inventory-pulse-value ${inventoryStats.lowStockCount > 0 ? 'is-alert' : 'is-safe'}`}>
                    {inventoryStats.lowStockCount}
                  </div>
                </article>
                <article className="inventory-pulse-item">
                  <div className="inventory-pulse-label">Categories</div>
                  <div className="inventory-pulse-value">{inventoryStats.categoriesCount}</div>
                </article>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div className="data-card dashboard-footnote">
        <div>
          <strong>Tip:</strong> Prioritize overdue services first, then AMC contracts expiring in under 30 days.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
