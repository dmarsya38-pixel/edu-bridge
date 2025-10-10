'use client';

import { useState } from 'react';
import { debugEmailSystem, checkEmailConfiguration, verifyEmailConnection, sendTestEmailEnhanced, EmailTestResult } from '@/lib/email';

export default function EmailDebugPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState<{
    host?: string;
    port?: string;
    user?: string;
    from?: string;
    pass?: string;
  } | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDebug = async () => {
    setIsLoading(true);
    addLog('Starting email system debug...');
    try {
      const result = await debugEmailSystem();
      if (result.success) {
        addLog('✅ Email system debug completed successfully');
      } else {
        addLog(`❌ Email system debug failed: ${result.message}`);
      }
      setConfig(result.config);
    } catch (error) {
      addLog(`❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleCheckConfig = async () => {
    setIsLoading(true);
    addLog('Checking email configuration...');
    try {
      const result = await checkEmailConfiguration();
      if (result.success) {
        addLog('✅ Email configuration is complete');
      } else {
        addLog(`❌ Configuration issues: ${result.message}`);
        if (result.missingVars) {
          addLog(`Missing variables: ${result.missingVars.join(', ')}`);
        }
      }
      setConfig(result.config);
    } catch (error) {
      addLog(`❌ Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleVerifyConnection = async () => {
    setIsLoading(true);
    addLog('Verifying email connection...');
    try {
      const isConnected = await verifyEmailConnection();
      if (isConnected) {
        addLog('✅ Email connection verified successfully');
      } else {
        addLog('❌ Email connection failed');
      }
    } catch (error) {
      addLog(`❌ Connection verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      addLog('❌ Please enter a test email address');
      return;
    }
    setIsLoading(true);
    addLog(`Sending test email to ${testEmail}...`);
    try {
      const result: EmailTestResult = await sendTestEmailEnhanced(testEmail);
      if (result.success) {
        addLog(`✅ Test email sent successfully to ${testEmail}`);
        if (result.messageId) {
          addLog(`Message ID: ${result.messageId}`);
        }
      } else {
        addLog(`❌ Failed to send test email: ${result.message}`);
        if (result.error) {
          addLog(`Error details: ${result.error}`);
        }

        // Provide helpful guidance for Resend errors
        if (result.error?.includes('API key is invalid')) {
          addLog('💡 Solution: Check your Resend API key and ensure it\'s valid');
        } else if (result.error?.includes('Domain not verified')) {
          addLog('💡 Solution: Verify your domain in Resend dashboard or use onboarding@resend.dev');
        } else if (result.error?.includes('missing_api_key')) {
          addLog('💡 Solution: Add your Resend API key to environment variables');
        }
      }
    } catch (error) {
      addLog(`❌ Test email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Email System Debug Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <button
            onClick={handleDebug}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Running...' : '🔧 Run Full Debug'}
          </button>

          <button
            onClick={handleCheckConfig}
            disabled={isLoading}
            className="w-full bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : '⚙️ Check Configuration'}
          </button>

          <button
            onClick={handleVerifyConnection}
            disabled={isLoading}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : '🔌 Verify Connection'}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleSendTest}
              disabled={isLoading}
              className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : '📧 Send Test'}
            </button>
          </div>

          <button
            onClick={clearLogs}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded"
          >
            🗑️ Clear Logs
          </button>
        </div>
      </div>

      {config && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Current Configuration:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Host:</strong> {config.host}</div>
            <div><strong>Port:</strong> {config.port}</div>
            <div><strong>User:</strong> {config.user}</div>
            <div><strong>From:</strong> {config.from}</div>
            <div><strong>Password:</strong> {config.pass ? '***' : 'Not set'}</div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Run a test to see debugging information.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 <strong>Resend.com Setup:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Make sure your Resend API key is valid and active</li>
          <li>Verify your domain in Resend dashboard or use onboarding@resend.dev for testing</li>
          <li>Check both this panel &amp; your server terminal for detailed logs</li>
          <li>Make sure all Resend environment variables are set correctly</li>
          <li>Test emails are usually delivered instantly</li>
          <li>Check spam/junk folders if you don&apos;t see the test email</li>
        </ul>
      </div>
    </div>
  );
}