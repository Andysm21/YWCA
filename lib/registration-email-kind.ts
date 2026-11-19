/** Which email fits a registration's current status (shared by the portal UI and the resend route). */
export type RegistrationEmailKind = 'pending_payment' | 'promoted' | 'confirmed' | 'waitlist';

export function emailKindFor(status: string, promotedFromWaitlistAt?: string | null): { kind: RegistrationEmailKind; label: string; description: string } | null {
  switch (status) {
    case 'pending_payment':
      return promotedFromWaitlistAt
        ? { kind: 'promoted', label: '"It\'s your turn" email', description: 'Off the waitlist: tells them a spot is held and gives the payment link.' }
        : { kind: 'pending_payment', label: 'Payment email', description: 'Tells them to pay and upload proof of payment, with their payment link.' };
    case 'confirmed':
      return { kind: 'confirmed', label: '"You\'re in" confirmation email', description: 'Registered, paid and spot secured, with dates and meeting points.' };
    case 'waitlisted':
      return { kind: 'waitlist', label: 'Waitlist email', description: 'Camp is full, they are on the waitlist, no payment needed yet.' };
    default:
      return null;
  }
}
