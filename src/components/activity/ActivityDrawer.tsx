import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { 
  History, 
  X, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Layers 
} from 'lucide-react';
import { AuditAction } from '../../types';

export const ActivityDrawer: React.FC = () => {
  const { isActivityOpen, setIsActivityOpen, auditLogs, currentGroup } = useApp();

  if (!isActivityOpen) return null;

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return {
          icon: PlusCircle,
          label: 'Added',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'UPDATE':
        return {
          icon: Edit3,
          label: 'Edited',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'DELETE':
        return {
          icon: Trash2,
          label: 'Deleted',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      case 'SETTLE':
        return {
          icon: CheckCircle2,
          label: 'Settled',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
        };
      case 'BUDGET_UPDATE':
        return {
          icon: Edit3,
          label: 'Budget',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
        };
      case 'RECURRING_CREATE':
        return {
          icon: PlusCircle,
          label: 'Recurring',
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/30'
        };
      default:
        return {
          icon: PlusCircle,
          label: 'Action',
          color: 'text-slate-400 bg-white/10 border-white/20'
        };
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-md">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsActivityOpen(false)} 
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative z-10 w-full max-w-md h-full glass-3d-volumetric p-6 flex flex-col border-l border-white/15 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Activity History</h2>
              <p className="text-xs text-slate-400">{currentGroup?.name || 'Group'} Timeline</p>
            </div>
          </div>
          <button 
            onClick={() => setIsActivityOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Feed */}
        <div className="mt-6 flex-1 overflow-y-auto pr-1 space-y-4">
          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Layers className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium">No activity recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">Expenses added or modified will appear here in real-time.</p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;

              return (
                <div 
                  key={log.id} 
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={log.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${log.userId}`} 
                        alt={log.userName}
                        className="w-7 h-7 rounded-full border border-white/20 object-cover"
                      />
                      <span className="text-xs font-semibold text-white">{log.userName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${badge.color}`}>
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {log.description}
                  </p>

                  {log.changes?.oldState && log.changes?.newState && (
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span className="line-through text-slate-500">
                        {log.changes.oldState.title} ({(log.changes.oldState.amount / 100).toFixed(2)})
                      </span>
                      <span className="text-emerald-400">
                        → {log.changes.newState.title} ({(log.changes.newState.amount / 100).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
