<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DepositSlipMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array  $slip  Pre-formatted slip data (see DepositRequestController::sendDepositSlip()).
     */
    public function __construct(public array $slip)
    {
    }

    public function envelope(): Envelope
    {
        $site = $this->slip['site_name'] ?? 'Samity Management';

        return new Envelope(
            subject: "{$site} — Deposit Confirmation",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.deposit-slip',
            with: ['slip' => $this->slip],
        );
    }
}
