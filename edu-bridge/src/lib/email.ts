
// Email data interfaces
export interface CommentEmailData {
  userEmail: string;
  commenterName: string;
  materialTitle: string;
  commentContent: string;
  materialLink: string;
  programmeId: string;
  subjectCode: string;
}

export interface ApprovalEmailData {
  userEmail: string;
  approverName: string;
  materialTitle: string;
  approvalAction: 'approved' | 'rejected';
  rejectionReason?: string;
  materialLink: string;
  programmeId: string;
  subjectCode: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  error?: string;
  messageId?: string;
}

// Verify transporter configuration via API
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'verify-connection' }),
    });

    const result = await response.json();
    console.log('🔍 Email connection verification result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Email connection verification failed:', error);
    return false;
  }
}

// Check email configuration
export async function checkEmailConfiguration() {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check-configuration' }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Email configuration check failed:', error);
    return {
      success: false,
      message: 'Failed to check email configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Debug email system - comprehensive test
export async function debugEmailSystem() {
  console.log('🔧 Starting email system debug...\n');

  // Step 1: Check configuration
  console.log('1. Checking Gmail configuration...');
  const configCheck = await checkEmailConfiguration();

  if (!configCheck.success) {
    console.log('❌ Gmail configuration issues:');
    console.log('   Message:', configCheck.message);
    if (configCheck.missingVars) {
      console.log('   Missing variables:', configCheck.missingVars.join(', '));
    }
    console.log('   Config:', configCheck.config);
    return configCheck;
  }

  console.log('✅ Gmail configuration is complete');
  console.log('   Host:', configCheck.config?.host);
  console.log('   Port:', configCheck.config?.port);
  console.log('   User:', configCheck.config?.user);
  console.log('   From:', configCheck.config?.from);

  // Step 2: Verify connection
  console.log('\n2. Verifying Gmail transporter connection...');
  const connectionOk = await verifyEmailConnection();

  if (!connectionOk) {
    console.log('❌ Gmail transporter connection failed');
    return {
      success: false,
      message: 'Gmail transporter connection failed',
      config: configCheck.config
    };
  }

  console.log('✅ Gmail transporter connection verified');

  // Step 3: Send test email (optional - would require user email)
  console.log('\n3. Email system is ready to send emails');
  console.log('💡 To send a test email, use sendTestEmail(your-email@example.com)');

  return {
    success: true,
    message: 'Email system is properly configured and connected',
    config: configCheck.config
  };
}

// Enhanced test email function
export async function sendTestEmailEnhanced(userEmail: string): Promise<EmailTestResult> {
  console.log('📧 Sending test email to:', userEmail);

  // First check configuration
  const configCheck = await checkEmailConfiguration();
  if (!configCheck.success) {
    console.log('❌ Configuration check failed:', configCheck.message);
    return {
      success: false,
      message: 'Email configuration incomplete',
      error: configCheck.error
    };
  }

  const result = await sendTestEmail(userEmail);

  if (result.success) {
    console.log('✅ Test email sent successfully');
    if (result.messageId) {
      console.log('📧 Message ID:', result.messageId);
    }
  } else {
    console.log('❌ Test email failed:', result.message);
    if (result.error) {
      console.log('   Error details:', result.error);
    }

    // Provide helpful guidance for common Gmail errors
    if (result.error?.includes('Username and Password not accepted')) {
      console.log('💡 Solution: Check your Gmail credentials and enable "Less secure app access"');
    } else if (result.error?.includes('Please log in via your web browser')) {
      console.log('💡 Solution: Enable "Less secure app access" in your Google Account settings');
    }
  }

  return result;
}

// Generate comment notification email template
export function generateCommentEmailTemplate(data: CommentEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edu-bridge.vercel.app';

  // Truncate comment content for preview
  const truncatedComment = data.commentContent.length > 200
    ? data.commentContent.substring(0, 200) + '...'
    : data.commentContent;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Comment on Your Material</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
        }
        .material-info {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid #2563eb;
        }
        .material-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
        }
        .material-meta {
            font-size: 14px;
            color: #64748b;
            margin: 0;
        }
        .comment-section {
            margin-bottom: 24px;
        }
        .commenter-name {
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 8px;
        }
        .comment-content {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            font-style: italic;
            color: #475569;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .cta-button {
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            transition: background-color 0.2s;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            border: 2px solid #1d4ed8;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
            border-color: #1e40af;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 480px) {
            .container {
                margin: 0 16px;
            }
            .content {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Comment on Your Material</h1>
        </div>

        <div class="content">
            <div class="material-info">
                <h2 class="material-title">${data.materialTitle}</h2>
                <p class="material-meta">${data.subjectCode} • ${data.programmeId}</p>
            </div>

            <div class="comment-section">
                <p class="commenter-name">${data.commenterName} commented:</p>
                <div class="comment-content">
                    "${truncatedComment}"
                </div>
            </div>

            <div class="button-container">
                <a href="${data.materialLink}" class="cta-button">
                    View Comment & Reply
                </a>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent by EduBridge. You received this because someone commented on your material.</p>
            <p>
                <a href="${appUrl}/settings/notifications">Manage Notification Preferences</a> •
                <a href="${appUrl}/help">Help Center</a>
            </p>
            <p>© 2024 EduBridge. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate material approval notification email template
export function generateApprovalEmailTemplate(data: ApprovalEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edu-bridge.vercel.app';

  const isApproval = data.approvalAction === 'approved';
  const headerColor = isApproval ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
  const headerIcon = isApproval ? '✅' : '❌';
  const headerTitle = isApproval ? 'Your Material Has Been Approved! 🎉' : 'Update on Your Material Submission';
  const actionText = isApproval ? 'approved' : 'rejected';
  const actionVerb = isApproval ? 'Approve' : 'Reject';
  const buttonColor = isApproval ? '#059669' : '#dc2626';
  const buttonHover = isApproval ? '#047857' : '#b91c1c';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: ${headerColor};
            color: white;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
        }
        .material-info {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid ${buttonColor};
        }
        .material-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
        }
        .material-meta {
            font-size: 14px;
            color: #64748b;
            margin: 0;
        }
        .approval-section {
            margin-bottom: 24px;
        }
        .approver-name {
            font-weight: 600;
            color: ${buttonColor};
            margin-bottom: 8px;
        }
        .approval-content {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            color: #475569;
        }
        .rejection-reason {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            color: #991b1b;
        }
        .rejection-reason h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .cta-button {
            background-color: ${buttonColor};
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            transition: background-color 0.2s;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            border: 2px solid ${buttonHover};
        }
        .cta-button:hover {
            background-color: ${buttonHover};
            border-color: ${isApproval ? '#065f46' : '#991b1b'};
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 480px) {
            .container {
                margin: 0 16px;
            }
            .content {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${headerIcon} ${headerTitle}</h1>
        </div>

        <div class="content">
            <div class="material-info">
                <h2 class="material-title">${data.materialTitle}</h2>
                <p class="material-meta">${data.subjectCode} • ${data.programmeId}</p>
            </div>

            <div class="approval-section">
                <p class="approver-name">${data.approverName} ${actionText} your material</p>
                <div class="approval-content">
                    ${isApproval
                        ? `Congratulations! Your material has been approved and is now available to all students.`
                        : `Your material submission has been reviewed.`
                    }
                </div>
                ${data.rejectionReason ? `
                <div class="rejection-reason">
                    <h4>Reason for rejection:</h4>
                    <p>${data.rejectionReason}</p>
                    <p style="margin: 8px 0 0 0; font-size: 13px;">Please review the feedback and consider submitting a revised version.</p>
                </div>
                ` : ''}
            </div>

            <div class="button-container">
                <a href="${data.materialLink}" class="cta-button">
                    ${isApproval ? 'View Approved Material' : 'View Submission'}
                </a>
            </div>
        </div>

        <div class="footer">
            <p>This email was sent by EduBridge. You received this because your material submission was ${actionText}.</p>
            <p>
                <a href="${appUrl}/settings/notifications">Manage Notification Preferences</a> •
                <a href="${appUrl}/help">Help Center</a>
            </p>
            <p>© 2024 EduBridge. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send comment notification email via API
export async function sendCommentEmail(data: CommentEmailData): Promise<EmailTestResult> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-comment-email',
        ...data
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to send email via API:', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send approval notification email via API
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<EmailTestResult> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-approval-email',
        ...data
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to send approval email via API:', error);
    return {
      success: false,
      message: 'Failed to send approval email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send test email via API
export async function sendTestEmail(userEmail: string): Promise<EmailTestResult> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-test-email',
        userEmail
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Failed to send test email via API:', error);
    return {
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to generate material link
export function generateMaterialLink(
  programmeId: string,
  subjectCode: string,
  materialId: string,
  showComments: boolean = true
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edu-bridge.vercel.app';
  const params = new URLSearchParams({
    programme: programmeId,
    subject: subjectCode,
    material: materialId,
    showComments: showComments.toString()
  });
  return `${appUrl}/dashboard?${params.toString()}`;
}