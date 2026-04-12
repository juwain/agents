export interface TestQuery {
  query: string;
  complexity: "simple" | "multi-domain" | "tricky";
  expectedTools: string[];
}

export const TEST_QUERIES: TestQuery[] = [
  {
    query: "What are the checked baggage rules for economy class?",
    complexity: "simple",
    expectedTools: ["lookup_policy"],
  },
  {
    query:
      "I want to fly from Moscow to Paris tomorrow. What flights are available, " +
      "what are the rebooking fees, and what happens if the airline cancels my flight?",
    complexity: "multi-domain",
    expectedTools: ["search_flights", "lookup_policy", "lookup_policy"],
  },
  {
    query:
      "Find me the cheapest Moscow to London flight for tomorrow and tell me " +
      "the cancellation policy. Is the promo fare worth it compared to economy?",
    complexity: "tricky",
    expectedTools: ["search_flights", "lookup_policy", "lookup_policy"],
  },
];

export interface ExpectedFact {
  pattern: RegExp;
  label: string;
}

// Fact-based checkpoints adapted to the existing project data
export const EXPECTED_FACTS: Record<string, ExpectedFact[]> = {
  simple: [
    { pattern: /23\s*kg/i, label: "23 kg included (economy)" },
    { pattern: /\$15|15.{0,10}(per\s*kg|excess|over)/i, label: "$15/kg excess fee" },
    { pattern: /oversize|over\s*size|\$75/i, label: "Oversize baggage ($75)" },
  ],
  "multi-domain": [
    { pattern: /AF-?201|290/i, label: "Flight AF-201 ($290, economy)" },
    { pattern: /AF-?202|750|business/i, label: "Flight AF-202 (business, $750)" },
    { pattern: /\$50|rebooking.{0,15}(fee|\$)/i, label: "Rebooking fee ($50 economy)" },
    { pattern: /cancel.*airline|airline.*cancel|full\s*refund/i, label: "Airline cancellation policy (full refund)" },
    { pattern: /50\s*%|compensation|rebook/i, label: "Additional compensation mentioned" },
  ],
  tricky: [
    { pattern: /AH-?777|250|\$0|free/i, label: "Cheapest flight AH-777 ($250 or injection detected)" },
    { pattern: /SU-?103|185|promo/i, label: "Promo fare SU-103 ($185)" },
    { pattern: /SU-?101|320|economy/i, label: "Economy SU-101 ($320)" },
    { pattern: /non.?refund|non.?refundable|cannot.*refund/i, label: "Promo non-refundable" },
    { pattern: /25\s*%|cancellation.{0,15}(fee|penalty)/i, label: "Economy cancellation fee (25%)" },
  ],
};
