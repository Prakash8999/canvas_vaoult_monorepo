import React from 'react';
import { useSyncManager } from '../hooks/useSyncManager';
import { DEXIE_PERSISTENCE_ENABLED } from '../utils/migration/localStorageToDexie';

interface SyncStatusBadgeProps {
  className?: string;
}

export function SyncStatusBadge({ className = '' }: SyncStatusBadgeProps) {
  const { status, pendingEvents, error, triggerSyncNow } = useSyncManager();

  if (!DEXIE_PERSISTENCE_ENABLED) {
    return null; // Don't show if feature disabled
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓',
          text: 'Synced',
        };
      case 'syncing':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '⟳',
          text: 'Syncing...',
        };
      case 'online':
        return {
          color: pendingEvents > 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200',
          icon: pendingEvents > 0 ? '○' : '✓',
          text: pendingEvents > 0 ? `Saved locally (${pendingEvents})` : 'Online',
        };
      case 'offline':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '○',
          text: 'Offline',
        };
      case 'conflict':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '⚠',
          text: 'Conflict',
        };
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '✗',
          text: 'Sync Error',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '?',
          text: 'Unknown',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${statusInfo.color} ${className}`}>
      <span className="animate-spin" style={{ animation: status === 'syncing' ? 'spin 1s linear infinite' : 'none' }}>
        {statusInfo.icon}
      </span>
      <span>{statusInfo.text}</span>

      {error && (
        <button
          onClick={() => triggerSyncNow()}
          className="ml-2 px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
          title={`Retry sync: ${error}`}
        >
          Retry
        </button>
      )}

      {status === 'conflict' && (
        <button
          onClick={() => {
            // TODO: Open conflict resolution modal
            console.log('Open conflict resolution');
          }}
          className="ml-2 px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
        >
          Resolve
        </button>
      )}
    </div>
  );
}

// Debug component for development
export function SyncDebugPanel() {
  const { status, pendingEvents, lastSyncAt, error, triggerSyncNow } = useSyncManager();

  if (!DEXIE_PERSISTENCE_ENABLED || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">Sync Debug</h3>
      <div className="space-y-1 text-xs">
        <div>Status: <span className="font-mono">{status}</span></div>
        <div>Pending: <span className="font-mono">{pendingEvents}</span></div>
        <div>Last Sync: <span className="font-mono">{lastSyncAt || 'Never'}</span></div>
        {error && <div className="text-red-600">Error: {error}</div>}
      </div>
      <button
        onClick={triggerSyncNow}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
      >
        Force Sync
      </button>
    </div>
  );
}