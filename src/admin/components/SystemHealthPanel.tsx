import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react';
import { CmsHealthAuditResult, runCmsHealthAudit } from '../../services/cmsHealthService';
import { CmsDiagnosticEntry, clearCmsDiagnosticLogs, getCmsDiagnosticLogs } from '../../services/cmsAuthService';
import { CMS_REPAIR_SQL_MIGRATION } from '../../services/cmsRepairSql';

export const SystemHealthPanel: React.FC = () => {
  const [audit, setAudit] = useState<CmsHealthAuditResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [logs, setLogs] = useState<CmsDiagnosticEntry[]>([]);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showRepairSql, setShowRepairSql] = useState<boolean>(false);

  const executeAudit = async () => {
    setIsRunning(true);
    try {
      const result = await runCmsHealthAudit();
      setAudit(result);
      setLogs(getCmsDiagnosticLogs());
      if (result.needsRepairMigration) {
        setShowRepairSql(true);
      }
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeAudit();
  }, []);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(CMS_REPAIR_SQL_MIGRATION);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2200);
    } catch {
      setCopiedSql(false);
    }
  };

  const handleClearLogs = () => {
    clearCmsDiagnosticLogs();
    setLogs([]);
  };

  const statusBadge = () => {
    if (isRunning && !audit) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono text-sky-300 font-semibold">
          <Loader2 className="w-3 h-3 animate-spin" />
          AUDITING
        </span>
      );
    }
    if (!audit || audit.overallStatus === 'action_required') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono text-rose-300 font-semibold">
          <ShieldAlert className="w-3 h-3" />
          ACTION REQUIRED
        </span>
      );
    }
    if (audit.overallStatus === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-semibold">
          <AlertTriangle className="w-3 h-3" />
          WARNINGS DETECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        ALL CHECKS PASSED
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              SYSTEM &amp; PERMISSIONS AUDIT
            </span>
            {statusBadge()}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            CMS Authorization &amp; Infrastructure Health
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-0.5">
            Verifies Supabase Auth session, SECURITY DEFINER admin role checks, RLS policies, grants, RPCs, and storage access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRepairSql((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{showRepairSql ? 'Hide Repair SQL' : 'View Repair SQL'}</span>
          </button>

          <button
            type="button"
            onClick={executeAudit}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Auditing...' : 'Run Permission Audit'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl border border-white/10 bg-[#0E131F]/80 space-y-1.5">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
            <span>ADMIN VERIFICATION</span>
            <KeyRound className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div className="text-sm font-bold text-white">
            {audit?.authorized ? 'Authorized Admin' : 'Verification Failed'}
          </div>
          <div className="text-[11px] text-[#64748B] truncate">
            {audit?.userEmail || audit?.error || 'Checking session...'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#0E131F]/80 space-y-1.5">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
            <span>ADMIN_USERS TABLE</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-sm font-bold ${audit?.adminUsersLocked ? 'text-emerald-400' : 'text-amber-300'}`}>
            {audit?.adminUsersLocked ? 'Locked Down' : 'Check Needed'}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Direct client reads revoked
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#0E131F]/80 space-y-1.5">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
            <span>ATOMIC ABOUT RPCS</span>
            <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div
            className={`text-sm font-bold ${
              audit?.functions.publish_about_cms && audit?.functions.private_is_admin
                ? 'text-emerald-400'
                : 'text-amber-300'
            }`}
          >
            {audit?.functions.publish_about_cms ? 'Installed & Active' : 'Migration Pending'}
          </div>
          <div className="text-[11px] text-[#64748B]">
            publish_about_cms · is_admin
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#0E131F]/80 space-y-1.5">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
            <span>STORAGE BUCKET</span>
            <HardDrive className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div
            className={`text-sm font-bold ${
              audit?.storage.bucketExists && (audit?.storage.policyCount || 0) >= 2
                ? 'text-emerald-400'
                : 'text-amber-300'
            }`}
          >
            {audit?.storage.bucketExists ? 'portfolio-media Ready' : 'Not Verified'}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Policies: {audit?.storage.policyCount ?? 0}/2
          </div>
        </div>
      </div>

      {/* Findings / Alerts */}
      {audit && audit.findings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>DIAGNOSTIC FINDINGS ({audit.findings.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs font-mono text-amber-100/90 list-disc pl-5">
            {audit.findings.map((finding, idx) => (
              <li key={idx}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Copyable Repair SQL */}
      {showRepairSql && (
        <div className="rounded-2xl border border-[#38BDF8]/30 bg-[#0E131F] p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#38BDF8]" />
                <span>Idempotent CMS Permission &amp; Atomic Publishing Repair SQL</span>
              </h2>
              <p className="text-xs font-mono text-[#94A3B8] mt-0.5">
                Copy and execute once in Supabase Dashboard → SQL Editor. Safe to re-run without modifying content rows.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold cursor-pointer self-start sm:self-auto"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy Repair SQL'}</span>
            </button>
          </div>
          <pre className="max-h-72 overflow-auto p-4 rounded-xl bg-[#080B11] border border-white/10 text-[11px] font-mono text-[#CBD5E1] whitespace-pre-wrap select-all">
            {CMS_REPAIR_SQL_MIGRATION}
          </pre>
        </div>
      )}

      {/* Per-Table Audit Table */}
      {audit && audit.tables.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                TABLE PERMISSIONS &amp; RLS MATRIX
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              Checked: {new Date(audit.checkedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#080B11] text-[10px] text-[#64748B] uppercase">
                <tr>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Exists</th>
                  <th className="px-4 py-3">RLS</th>
                  <th className="px-4 py-3">Policies</th>
                  <th className="px-4 py-3">Anon Read</th>
                  <th className="px-4 py-3">Auth CRUD</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {audit.tables.map((tbl) => (
                  <tr key={tbl.table} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-white font-medium">{tbl.table}</td>
                    <td className="px-4 py-2.5">{tbl.exists ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2.5">{tbl.rls_enabled ? 'Enabled' : 'Disabled'}</td>
                    <td className="px-4 py-2.5">{tbl.policy_count}</td>
                    <td className="px-4 py-2.5">
                      {tbl.table === 'about_drafts'
                        ? tbl.anon_select
                          ? 'Exposed'
                          : 'Restricted'
                        : tbl.anon_select
                        ? 'Granted'
                        : 'Missing'}
                    </td>
                    <td className="px-4 py-2.5">{tbl.auth_select && tbl.auth_write ? 'Granted' : 'Missing'}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tbl.status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tbl.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tbl.status === 'healthy' ? 'HEALTHY' : tbl.issue || tbl.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sanitized Session Diagnostic Log */}
      <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              RECENT CMS DIAGNOSTIC EVENTS (SANITIZED)
            </h2>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141B2D] hover:bg-[#1E293B] text-[11px] font-mono text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#080B11] border border-white/5 text-xs font-mono text-[#64748B]">
            No CMS errors recorded in this admin session.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-[#080B11] border border-white/5 font-mono text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px]">
                      {entry.category}
                    </span>
                    {entry.code && <span className="text-[#64748B]">[{entry.code}]</span>}
                    <span className="text-[#94A3B8]">{entry.context}</span>
                  </div>
                  <div className="text-white">{entry.message}</div>
                </div>
                <span className="text-[10px] text-[#64748B] shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
