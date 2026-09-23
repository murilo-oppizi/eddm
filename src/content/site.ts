// All homepage copy lives here so it can be edited without touching layout code.
// Numbers and claims are placeholders — confirm with marketing before launch.

export const site = {
  name: "EDDM",
  tagline: "Every Door Direct Mail, made simple.",
  description:
    "Reach every home in the neighborhoods you choose. Pick routes on a map, design your postcard, and we handle printing and USPS delivery.",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Why EDDM", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  primaryCta: { label: "Start a campaign", href: "#get-started" },
  secondaryCta: { label: "See pricing", href: "#pricing" },
}

export const hero = {
  eyebrow: "USPS Every Door Direct Mail®",
  title: "Put your business in every mailbox on the block.",
  body: "No mailing lists, no guesswork. Choose the neighborhoods you want on a map, upload or design your postcard, and we print and deliver it to USPS for you.",
  checks: ["USPS-compliant", "No mailing list needed", "Full support included"],
}

export const steps = [
  {
    title: "Pick your neighborhoods",
    body: "Search a ZIP code or address and select carrier routes on the map. See household counts and demographics as you go.",
  },
  {
    title: "Design your postcard",
    body: "Start from a template, upload your own artwork, or work with our designers. We check it meets USPS size rules.",
  },
  {
    title: "We print and deliver",
    body: "We print, bundle and drop your mail at the post office. Your mail carrier delivers it to every door on the route.",
  },
]

export const features = [
  { icon: "map", title: "Map-based targeting", body: "Choose exactly which streets and neighborhoods hear from you." },
  { icon: "users", title: "Real demographics", body: "Filter routes by household income, age and home ownership." },
  { icon: "printer", title: "Print included", body: "High-quality, full-color postcards printed on thick stock." },
  { icon: "truck", title: "USPS drop-off handled", body: "We prepare the paperwork and deliver bundles to the post office." },
  { icon: "chart", title: "Track your results", body: "Use QR codes and call tracking to see what your mail brings in." },
  { icon: "sparkles", title: "AI-optimized routes", body: "Describe your ideal customer and our AI agents suggest the best routes to reach them." },
] as const

// Source: oppizi.com EDDM page ("$0.31 USD per piece · all-in", "$4,650 for ~15,000
// addresses", USPS postage $0.260/piece per Notice 123, July 2026). TO CONFIRM with
// marketing: eddm.com still says "from 7¢/piece", and whether $0.31 applies to every size.
export const pricing = {
  perPiece: "$0.31",
  example: { homes: "15,000", total: "$4,650" },
  included: [
    "Printing through 700+ local print partners",
    "USPS postage and post office drop-off",
    "Route selection with demographic filters",
    "Design tool with USPS-ready templates",
    "Delivery and scan tracking dashboard",
  ],
  noFees: "No mailing lists, data fees or setup fees.",
}

export const faqs = [
  {
    q: "What is Every Door Direct Mail?",
    a: "EDDM is a USPS service that lets you send mail to every address on a carrier route without buying a mailing list. It's one of the most affordable ways to reach a local area.",
  },
  {
    q: "How much does Every Door Direct Mail cost?",
    a: "You pay per piece, all-in: printing, USPS postage and delivery are included, with no mailing list or data fees. Campaigns start from $0.31 per piece, so reaching 15,000 homes costs about $4,650. You see the full price before you order.",
  },
  {
    q: "How fast is EDDM delivery?",
    a: "Printing usually takes 2–3 business days. Once we drop your mail at the post office, carriers typically deliver it within 2–5 business days, so most campaigns land in mailboxes about a week after you order.",
  },
  {
    q: "Can I choose who receives my mail?",
    a: "You choose carrier routes, not individual people. You can filter routes by demographics like household income and age to focus on the right neighborhoods.",
  },
  {
    q: "Can EDDM campaign results be tracked?",
    a: "Yes. Add a unique QR code, phone number or promo code to your postcard and every scan, call or redemption is tied back to your campaign, so you can see which neighborhoods respond best and where to mail next.",
  },
  {
    q: "Who should use Every Door Direct Mail?",
    a: "Any business that serves a local area: restaurants, home services, real estate agents, dentists, gyms, retail stores and more. It also works well for grand openings, local events and community announcements.",
  },
  {
    q: "Do I need a design?",
    a: "No. You can start from one of our templates, upload your own artwork, or have our design team create one for you.",
  },
]
