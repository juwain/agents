export interface PolicyChunk {
  title: string;
  content: string;
}

export const POLICIES: PolicyChunk[] = [
  {
    title: "Flight Delay Compensation",
    content:
      "Passengers are eligible for compensation when a flight is delayed by more than 4 hours " +
      "at the final destination. Compensation amounts: delays of 4-8 hours — 25% of the ticket fare; " +
      "delays over 8 hours — 50% of the ticket fare. The airline also provides complimentary meals, " +
      "refreshments, and hotel accommodation for overnight delays. Compensation is not applicable " +
      "in cases of extraordinary circumstances (severe weather, air traffic control strikes).",
  },
  {
    title: "Flight Cancellation by Airline",
    content:
      "If the airline cancels a flight, passengers are entitled to a full refund of the ticket fare " +
      "or rebooking on the next available flight at no additional charge. Passengers notified less than " +
      "14 days before departure are also eligible for additional compensation equivalent to 50% of the " +
      "ticket fare. Hotel accommodation and meals are provided if the cancellation causes an overnight wait.",
  },
  {
    title: "Flight Rebooking Fees",
    content:
      "Rebooking fees depend on the fare class. Economy fares: $50 fee if changed more than 24 hours " +
      "before departure, $100 fee within 24 hours. Business fares: free rebooking at any time. " +
      "Promo fares: $100 fee regardless of timing. Date changes are subject to fare difference — " +
      "if the new flight is more expensive, the passenger pays the difference.",
  },
  {
    title: "Refund for Promo Fares",
    content:
      "Promo fare tickets are non-refundable. No monetary reimbursement is provided upon cancellation. " +
      "Exception: passengers with a documented medical emergency may apply for a full refund by submitting " +
      "a medical certificate within 30 days of the scheduled flight date. The refund review process " +
      "takes up to 14 business days.",
  },
  {
    title: "Refund for Economy Fares",
    content:
      "Economy fare tickets are refundable with a cancellation penalty. Cancellations made more than " +
      "72 hours before departure: 25% penalty applied to the ticket fare. Cancellations within 72 hours " +
      "of departure: 50% penalty. No-shows (passenger does not board without prior cancellation): " +
      "ticket is forfeited entirely with no reimbursement.",
  },
  {
    title: "Refund for Business Fares",
    content:
      "Business class tickets are fully refundable at any time before departure with no cancellation " +
      "penalty. Refunds are processed within 5-7 business days to the original payment method. " +
      "For tickets purchased with miles, the miles are reinstated to the passenger's account " +
      "within 3 business days of the cancellation request.",
  },
  {
    title: "Checked Baggage Allowance",
    content:
      "Checked baggage allowance by fare class: Promo — 1 bag up to 20 kg; Economy — 1 bag up to 23 kg; " +
      "Business — 2 bags up to 32 kg each. Excess baggage fee: $15 per kg over the limit. " +
      "Oversized items (over 158 cm total dimensions) are charged at $75 per item. " +
      "Sports equipment (skis, bicycles, golf clubs) must be declared at check-in and may incur " +
      "additional handling fees.",
  },
  {
    title: "Carry-on Restrictions",
    content:
      "Each passenger is allowed one carry-on bag (max 10 kg, max dimensions 55x40x20 cm) and one " +
      "personal item (laptop bag, handbag). Liquids must be in containers of 100 ml or less, placed " +
      "in a transparent resealable bag (max 1 litre total). Sharp objects, flammable materials, and " +
      "lithium batteries over 100 Wh are prohibited in carry-on baggage.",
  },
  {
    title: "Miles Accrual Rules",
    content:
      "Miles are accrued based on the distance flown and the fare class multiplier. Economy fares: " +
      "1x multiplier (1 mile per km flown). Business fares: 2x multiplier. Promo fares: 0.5x multiplier. " +
      "Miles are credited to the passenger's account within 72 hours of flight completion. " +
      "Partner airline flights accrue miles at 0.5x regardless of fare class.",
  },
  {
    title: "Miles Forfeiture on Cancellation",
    content:
      "Miles used to purchase award tickets are subject to forfeiture upon cancellation. " +
      "Cancellations made more than 30 days before departure: full miles reinstatement, $25 processing fee. " +
      "Cancellations within 30 days: 50% of miles forfeited. No-shows: all miles forfeited with no " +
      "reinstatement. Miles earned from cancelled flights are also reversed from the passenger's account.",
  },
  {
    title: "Pet Transport in Cabin",
    content:
      "Small pets (cats and dogs) may travel in the cabin if the total weight of the pet plus carrier " +
      "does not exceed 8 kg. The carrier must fit under the seat in front (max 45x30x25 cm). " +
      "Only one pet per passenger is permitted. A pet transport fee of $50 per flight applies. " +
      "Advance booking is required — cabin pet spaces are limited to 2 per flight.",
  },
  {
    title: "Pet Transport in Cargo",
    content:
      "Larger animals must travel in the cargo hold in an IATA-approved container. Maximum weight " +
      "(animal plus container): 75 kg. Temperature-sensitive animals (snub-nosed breeds, reptiles) " +
      "may be restricted on certain routes due to temperature conditions in the cargo hold. " +
      "A veterinary health certificate issued within 10 days of travel is required. " +
      "Cargo pet fee: $100-$200 depending on animal size.",
  },
  {
    title: "Date Change Policy",
    content:
      "Date changes are permitted on all fare classes subject to availability and applicable fees. " +
      "Economy and Promo fares: date change must be requested at least 2 hours before scheduled departure. " +
      "Business fares: date changes accepted up to 30 minutes before departure. " +
      "If the new flight date results in a higher fare, the passenger pays the fare difference. " +
      "If the new fare is lower, no refund is issued for the difference.",
  },
];
