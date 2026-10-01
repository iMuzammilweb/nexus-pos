import { getClientDeviceInfo } from './deviceAuthService';
import { PrimaryUserRole } from '../types';

export interface SendFailedLoginAlertParams {
  accountIdentifier: string;
  workspaceRole: PrimaryUserRole;
  workspaceName: string;
  failedAttempts: number;
  recipientEmail: string;
}

export interface SecurityAlertDispatchResult {
  success: boolean;
  message: string;
  alertId?: string;
  recipientEmail?: string;
  timestamp?: string;
}

/**
 * Dispatches a security notification to the configured Admin/Security email address
 * when 3 consecutive incorrect login attempts occur on any POS account.
 *
 * CRITICAL SECURITY GUARANTEE:
 * User passwords are NEVER saved, cached, sent, logged, or included in alerts.
 */
export async function sendFailedLoginSecurityAlert(
  params: SendFailedLoginAlertParams
): Promise<SecurityAlertDispatchResult> {
  const deviceInfo = getClientDeviceInfo();

  try {
    const res = await fetch('/api/pos/failed-login-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountIdentifier: params.accountIdentifier,
        workspaceRole: params.workspaceRole,
        workspaceName: params.workspaceName,
        failedAttempts: params.failedAttempts,
        recipientEmail: params.recipientEmail,
        deviceInfo: {
          name: deviceInfo.name,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || `Security notification dispatched to ${params.recipientEmail}`,
        alertId: data.alertId,
        recipientEmail: data.recipientEmail || params.recipientEmail,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[SECURITY] Failed to reach alert API endpoint, logging client security event:', err);
  }

  // Alert API unreachable (e.g. static hosting): nothing was actually sent
  return {
    success: false,
    message: 'Security alert service unreachable; notification was not sent.',
    alertId: `fallback_alert_${Date.now()}`,
    recipientEmail: params.recipientEmail,
    timestamp: new Date().toISOString(),
  };
}
