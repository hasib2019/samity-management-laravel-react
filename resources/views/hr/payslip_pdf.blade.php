<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #111827; font-size: 12px; }
        .header { margin-bottom: 8px; }
        .title { font-size: 18px; font-weight: bold; }
        .muted { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px; }
        th { text-align: left; }
        .right { text-align: right; }
        .totals { margin-top: 10px; }
        .totals td { border: none; padding: 4px 0; }
        .bold { font-weight: bold; }
    </style>
    </head>
<body>
    <div class="header">
        <div class="title">Payslip</div>
        <div class="muted">
            {{ $payslip->employee->full_name ?? ('Employee '.$payslip->employee_id) }}
        </div>
        <div class="muted">
            Period: {{ $payslip->run?->period_year }}-{{ str_pad($payslip->run?->period_month ?? 0, 2, '0', STR_PAD_LEFT) }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Component</th>
                <th>Type</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @php $components = is_array($payslip->components) ? $payslip->components : []; @endphp
            @foreach($components as $c)
            <tr>
                <td>{{ $c['name'] ?? '' }}</td>
                <td>{{ $c['type'] ?? '' }}</td>
                <td class="right">{{ number_format((float)($c['amount'] ?? 0), 2, '.', '') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Gross</td>
            <td class="right">{{ number_format((float)$payslip->gross, 2, '.', '') }}</td>
        </tr>
        <tr>
            <td>Deduction</td>
            <td class="right">{{ number_format((float)$payslip->total_deduction, 2, '.', '') }}</td>
        </tr>
        <tr class="bold">
            <td>Net Pay</td>
            <td class="right">{{ number_format((float)$payslip->net, 2, '.', '') }}</td>
        </tr>
    </table>
</body>
</html>
