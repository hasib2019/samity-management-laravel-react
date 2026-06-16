<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deposit Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:92%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1e3a8a; padding:28px 32px; color:#ffffff;">
                            <div style="font-size:20px; font-weight:bold;">{{ $slip['site_name'] }}</div>
                            <div style="font-size:14px; color:#bfdbfe; margin-top:4px;">Deposit Confirmation Slip</div>
                        </td>
                    </tr>

                    <!-- Amount banner -->
                    <tr>
                        <td style="padding:28px 32px 8px 32px;">
                            <p style="margin:0 0 4px 0; font-size:14px; color:#6b7280;">Dear {{ $slip['member_name'] }},</p>
                            <p style="margin:0 0 20px 0; font-size:14px; color:#6b7280;"><strong>Thank you for your payment.</strong> Your deposit has been received and posted successfully. The details are below.</p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#059669;">Amount Deposited</div>
                                        <div style="font-size:28px; font-weight:bold; color:#047857; margin-top:4px;">{{ $slip['currency'] }}{{ $slip['amount'] }}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Details -->
                    <tr>
                        <td style="padding:8px 32px 24px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Member</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['member_name'] }}@if(!empty($slip['member_code'])) ({{ $slip['member_code'] }})@endif</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Savings Account</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['account_number'] ?? '—' }}</td>
                                </tr>
                                @if(!empty($slip['is_subscription']) && !empty($slip['period']))
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Subscription Month</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['period'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Subscription Fee</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['currency'] }}{{ $slip['fee'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Penalty</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['currency'] }}{{ $slip['penalty'] }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Reference No.</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['reference'] ?? '—' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280; border-bottom:1px solid #f1f5f9;">Date</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; border-bottom:1px solid #f1f5f9;">{{ $slip['date'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0; color:#6b7280;">Balance After Deposit</td>
                                    <td style="padding:10px 0; text-align:right; font-weight:bold; color:#1e3a8a;">{{ $slip['currency'] }}{{ $slip['balance'] }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Thanks -->
                    <tr>
                        <td style="padding:0 32px 24px 32px;">
                            <p style="margin:0; font-size:14px; color:#374151;">Thank you for being a valued member of {{ $slip['site_name'] }}.</p>
                            <p style="margin:4px 0 0 0; font-size:14px; color:#374151;">Warm regards,<br><strong>{{ $slip['site_name'] }}</strong></p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc; padding:18px 32px; border-top:1px solid #e5e7eb;">
                            <p style="margin:0; font-size:12px; color:#9ca3af;">This is a system-generated confirmation. Please keep it for your records. If you did not make this deposit, contact the samity office immediately.</p>
                            <p style="margin:8px 0 0 0; font-size:12px; color:#9ca3af;">© {{ date('Y') }} {{ $slip['site_name'] }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
