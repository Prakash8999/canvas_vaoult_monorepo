import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api/axiosInstance';

/**
 * Debug component to test token refresh functionality
 * Add this to your app temporarily to test the refresh flow
 */
export function TokenRefreshDebug() {
    const { token, isAuthenticated, refreshToken } = useAuthStore();
    const [countdown, setCountdown] = useState(20);
    const [lastApiCall, setLastApiCall] = useState<string>('Never');

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 20));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleManualRefresh = async () => {
        console.log('🔄 Manual refresh triggered');
        const newToken = await refreshToken();
        console.log('New token:', newToken);
    };

    const handleTestApiCall = async () => {
        try {
            console.log('📡 Making test API call...');
            const response = await apiClient.get('/user');
            setLastApiCall(new Date().toLocaleTimeString());
            console.log('✅ API call successful:', response.data);
        } catch (error) {
            console.error('❌ API call failed:', error);
            setLastApiCall(`Failed at ${new Date().toLocaleTimeString()}`);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                background: '#1a1a1a',
                color: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: '12px',
                minWidth: '300px',
            }}
        >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4CAF50' }}>
                🔐 Token Refresh Debug
            </h3>

            <div style={{ marginBottom: '10px' }}>
                <strong>Status:</strong>{' '}
                <span style={{ color: isAuthenticated ? '#4CAF50' : '#f44336' }}>
                    {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Token Expires In:</strong>{' '}
                <span style={{ color: countdown < 5 ? '#f44336' : '#FFC107' }}>
                    ~{countdown}s
                </span>
            </div>

            <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                <strong>Token:</strong>{' '}
                <span style={{ fontSize: '10px', color: '#888' }}>
                    {token ? `${token.substring(0, 20)}...` : 'None'}
                </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Last API Call:</strong> {lastApiCall}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <button
                    onClick={handleManualRefresh}
                    style={{
                        padding: '8px 12px',
                        background: '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    🔄 Manual Refresh
                </button>

                <button
                    onClick={handleTestApiCall}
                    style={{
                        padding: '8px 12px',
                        background: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    📡 Test API Call
                </button>
            </div>

            <div
                style={{
                    marginTop: '10px',
                    padding: '8px',
                    background: '#333',
                    borderRadius: '4px',
                    fontSize: '10px',
                }}
            >
                <div>💡 <strong>Tips:</strong></div>
                <div>• Token expires in 20s</div>
                <div>• Auto-refresh every 15s</div>
                <div>• Check console for logs</div>
            </div>
        </div>
    );
}
