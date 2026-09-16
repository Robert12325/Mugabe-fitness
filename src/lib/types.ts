export type LeadStatus = "new" | "contacted" | "enrolled" | "archived";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "enrolled",
  "archived",
];

/** Where a visitor's UPI payment for their enquiry stands. "none" until they
 *  send proof; only the coach moves it to "verified" or "rejected". */
export type EnquiryPaymentStatus = "none" | "submitted" | "verified" | "rejected";

export const ENQUIRY_PAYMENT_STATUSES: EnquiryPaymentStatus[] = [
  "none",
  "submitted",
  "verified",
  "rejected",
];

export type EnquiryPayment = {
  status: EnquiryPaymentStatus;
  /** UPI transaction / UTR reference the visitor typed in. */
  txnId: string;
  /** ISO timestamps, "" until they happen. */
  submittedAt: string;
  reviewedAt: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  programId: string;
  slot: string;
  goal: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
  notes: string;
  payment: EnquiryPayment;
  /** The visitor account it was sent from, or "" for a guest. */
  userId: string;
};

export type Program = {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  slots: string[];
  featured: boolean;
  active: boolean;
};

export type MethodStep = {
  id: string;
  number: string;
  title: string;
  text: string;
};

export type Settings = {
  brandName: string;
  brandSuffix: string;
  tagline: string;
  coachEmail: string;
  coachPhone: string;
  /** The first photo. Kept for browsers that saved settings before
   *  `coachPhotos` existed. */
  coachPhoto: string;
  /** Up to MAX_COACH_PHOTOS pictures, spread across the site's sections.
   *  An empty slot falls through to the built-in photo for that slot. */
  coachPhotos: string[];
  adminPasscode: string;
};


/** What a payment record itself stores. "overdue" is deliberately absent —
 *  see `PaymentStatus`. */
export type PaymentState = "pending" | "paid" | "waived";

/** What the UI shows. `overdue` is derived from the due date at read time,
 *  never persisted: a stored "overdue" flag is wrong the moment the clock
 *  moves past midnight and nobody re-runs the job. */
export type PaymentStatus = "paid" | "waived" | "due" | "overdue";

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  programId: string;
  slot: string;
  /** Minor units (paise). Integers only — never floats for money. */
  amountMinor: number;
  /** Day of the month the invoice falls due, clamped 1-28 so every month
   *  has one. */
  billingDay: number;
  /** YYYY-MM-DD */
  startDate: string;
  active: boolean;
  /** Set when the client was converted from an enquiry. */
  leadId: string;
  notes: string;
};

export type Payment = {
  id: string;
  clientId: string;
  /** YYYY-MM. One invoice per client per month — this is the dedupe key. */
  period: string;
  /** YYYY-MM-DD */
  dueDate: string;
  amountMinor: number;
  state: PaymentState;
  /** YYYY-MM-DD, set when state is "paid". */
  paidDate: string;
  method: string;
  note: string;
};

export type DB = {
  version: number;
  leads: Lead[];
  programs: Program[];
  method: MethodStep[];
  clients: Client[];
  payments: Payment[];
  settings: Settings;
};
