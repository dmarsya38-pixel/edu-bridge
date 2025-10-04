import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend client lazily to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

// Email data interfaces
interface CommentEmailData {
  userEmail: string;
  commenterName: string;
  materialTitle: string;
  commentContent: string;
  materialLink: string;
  programmeId: string;
  subjectCode: string;
}

interface ApprovalEmailData {
  userEmail: string;
  approverName: string;
  materialTitle: string;
  approvalAction: 'approved' | 'rejected';
  rejectionReason?: string;
  materialLink: string;
  programmeId: string;
  subjectCode: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  error?: string;
  messageId?: string;
}

// Check Resend configuration
function checkResendConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const isConfigured = !!apiKey;

  return {
    config: {
      hasApiKey: !!apiKey,
      fromEmail
    },
    missingVars: !apiKey ? ['RESEND_API_KEY'] : [],
    isConfigured
  };
}

// Generate comment notification email template
function generateCommentEmailTemplate(data: CommentEmailData): string {
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
function generateApprovalEmailTemplate(data: ApprovalEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edu-bridge.vercel.app';

  const isApproval = data.approvalAction === 'approved';
  const headerColor = isApproval ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
  const headerIcon = isApproval ? '✅' : '❌';
  const headerTitle = isApproval ? 'Your Material Has Been Approved! 🎉' : 'Update on Your Material Submission';
  const actionText = isApproval ? 'approved' : 'rejected';
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

// Send comment notification email using Resend
async function sendCommentEmail(data: CommentEmailData): Promise<EmailTestResult> {
  try {
    // Check configuration first
    const configCheck = checkResendConfiguration();
    if (!configCheck.isConfigured) {
      console.error('❌ Resend configuration incomplete:', {
        missingVars: configCheck.missingVars,
        config: configCheck.config
      });
      return {
        success: false,
        message: 'Resend configuration incomplete',
        error: `Missing environment variables: ${configCheck.missingVars.join(', ')}`
      };
    }

    console.log('🔧 Resend configuration check:', {
      hasApiKey: configCheck.config.hasApiKey,
      fromEmail: configCheck.config.fromEmail
    });

    const subject = `${data.commenterName} commented on your material`;
    const html = generateCommentEmailTemplate(data);
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('📧 Sending email via Resend:', {
      to: data.userEmail,
      subject,
      from
    });

    const resend = getResendClient();
    const { data: emailData, error } = await resend.emails.send({
      from,
      to: [data.userEmail],
      subject,
      html,
      text: `${data.commenterName} commented on your material "${data.materialTitle}"\n\n"${data.commentContent.substring(0, 200)}${data.commentContent.length > 200 ? '...' : ''}"\n\nView the full comment: ${data.materialLink}`,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      return {
        success: false,
        message: 'Failed to send email via Resend',
        error: error.message
      };
    }

    console.log('✅ Email sent successfully via Resend:', {
      to: data.userEmail,
      subject,
      emailId: emailData?.id
    });

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: emailData?.id
    };
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      to: data.userEmail
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: 'Failed to send email',
      error: errorMessage
    };
  }
}

// Send approval notification email using Resend
async function sendApprovalEmail(data: ApprovalEmailData): Promise<EmailTestResult> {
  try {
    // Check configuration first
    const configCheck = checkResendConfiguration();
    if (!configCheck.isConfigured) {
      console.error('❌ Resend configuration incomplete:', {
        missingVars: configCheck.missingVars,
        config: configCheck.config
      });
      return {
        success: false,
        message: 'Resend configuration incomplete',
        error: `Missing environment variables: ${configCheck.missingVars.join(', ')}`
      };
    }

    const isApproval = data.approvalAction === 'approved';
    const subject = isApproval
      ? `Your material "${data.materialTitle}" has been approved! 🎉`
      : `Update on your material "${data.materialTitle}"`;

    const html = generateApprovalEmailTemplate(data);
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('📧 Sending approval email via Resend:', {
      to: data.userEmail,
      subject,
      from,
      approvalAction: data.approvalAction
    });

    const resend = getResendClient();
    const { data: emailData, error } = await resend.emails.send({
      from,
      to: [data.userEmail],
      subject,
      html,
      text: `${data.approverName} ${data.approvalAction} your material "${data.materialTitle}"\n\n${data.materialTitle} • ${data.subjectCode} • ${data.programmeId}\n\nView the material: ${data.materialLink}${data.rejectionReason ? `\n\nReason for ${data.approvalAction}: ${data.rejectionReason}` : ''}`,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      return {
        success: false,
        message: 'Failed to send approval email via Resend',
        error: error.message
      };
    }

    console.log('✅ Approval email sent successfully via Resend:', {
      to: data.userEmail,
      subject,
      emailId: emailData?.id
    });

    return {
      success: true,
      message: 'Approval email sent successfully',
      messageId: emailData?.id
    };
  } catch (error) {
    console.error('❌ Failed to send approval email via Resend:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      to: data.userEmail
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: 'Failed to send approval email',
      error: errorMessage
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    if (action === 'send-comment-email') {
      const emailData = data as CommentEmailData;
      const result = await sendCommentEmail(emailData);
      return NextResponse.json(result);
    }

    if (action === 'send-approval-email') {
      const emailData = data as ApprovalEmailData;
      const result = await sendApprovalEmail(emailData);
      return NextResponse.json(result);
    }

    if (action === 'send-test-email') {
      const { userEmail } = data as { userEmail: string };
      const testData: CommentEmailData = {
        userEmail,
        commenterName: 'Test User',
        materialTitle: 'Sample Material Title',
        commentContent: 'This is a test comment to verify that the email notification system is working correctly.',
        materialLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edu-bridge.vercel.app'}/dashboard`,
        programmeId: 'DBS',
        subjectCode: 'DPP20023'
      };
      const result = await sendCommentEmail(testData);
      return NextResponse.json(result);
    }

    if (action === 'verify-connection') {
      const configCheck = checkResendConfiguration();
      if (!configCheck.isConfigured) {
        return NextResponse.json({
          success: false,
          message: 'Resend configuration incomplete',
          config: configCheck.config,
          missingVars: configCheck.missingVars
        });
      }

      // For Resend, we can test the API key by sending a test email or checking the API
      try {
        // Simple API key validation by checking if we can access the Resend API
        const resend = getResendClient();
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: ['test@example.com'],
          subject: 'Connection Test',
          html: '<p>Test email - please ignore</p>',
        });

        if (error) {
          throw new Error(error.message);
        }

        return NextResponse.json({
          success: true,
          message: 'Resend API connection verified successfully',
          config: configCheck.config
        });
      } catch (error) {
        console.error('❌ Resend API verification failed:', error);
        return NextResponse.json({
          success: false,
          message: 'Resend API verification failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (action === 'check-configuration') {
      const configCheck = checkResendConfiguration();
      return NextResponse.json({
        success: configCheck.isConfigured,
        message: configCheck.isConfigured ? 'Resend configuration is complete' : 'Resend configuration is incomplete',
        config: configCheck.config,
        missingVars: configCheck.missingVars
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}