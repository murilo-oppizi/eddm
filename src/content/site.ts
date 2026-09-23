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

// Client logos and numbers from oppizi.com (Sept 2026). The numbers are Oppizi-wide,
// across all offline channels, not EDDM only. Logos: oppizi.com/brand/clients/*.svg.
export const trust = {
  label: "Trusted by 1,000+ companies",
  clients: [
    { name: "DoorDash", src: "/brand/clients/doordash.svg", width: 241, height: 29 },
    { name: "Uber Eats", src: "/brand/clients/uber.svg", width: 160, height: 28 }, // the file is the Uber Eats wordmark
    { name: "Chipotle", src: "/brand/clients/chipotle.svg", width: 170, height: 24 }, // wordmark only: badge removed from Oppizi's file
    { name: "Sephora", src: "/brand/clients/sephora.svg", width: 163, height: 20 },
    { name: "TikTok", src: "/brand/clients/tiktok.svg", width: 157, height: 42 },
    { name: "Uniqlo", src: "/brand/clients/uniqlo.svg", width: 50, height: 49 },
    { name: "ClassPass", src: "/brand/clients/classpass.svg", width: 178, height: 27 },
    { name: "Gopuff", src: "/brand/clients/gopuff.svg", width: 142, height: 47 },
    { name: "Wolt", src: "/brand/clients/wolt.svg", width: 88, height: 32 },
    { name: "Wonder", src: "/brand/clients/wonder.svg", width: 140, height: 26 },
    { name: "Getaround", src: "/brand/clients/getaround.svg", width: 157, height: 35 },
  ],
  stats: [
    { value: "306M+", label: "Pieces delivered since 2014" },
    { value: "1,000+", label: "Companies served" },
    { value: "12+", label: "Countries" },
    { value: "672K+", label: "Direct mail conversions tracked" },
  ],
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

// "AI planning" section. Capabilities are Oppizi's real AI features (oppizi.com, Sept
// 2026); the scenarios are illustrative examples. Every cost = homes × $0.31.
export const aiPlanning = {
  eyebrow: "AI planning",
  title: "Tell us your goal. Our agents plan the campaign.",
  body: "Describe your business in plain words and get routes, timing and budget in seconds.",
  placeholder: "Describe your business, who you want to reach and your budget…",
  scenarios: [
    {
      chip: "Coffee shop",
      icon: "coffee",
      area: "Williamsburg",
      brief:
        "I run a coffee shop in Williamsburg. I want young families within walking distance. Budget around $1,500.",
      plan: [
        { icon: "route", label: "Routes", value: "6 routes · 4,820 homes" },
        { icon: "users", label: "Audience match", value: "Age 25–44 · families" },
        { icon: "calendar", label: "Best timing", value: "Lands Thursday, before the weekend" },
        { icon: "receipt", label: "Estimated cost", value: "$1,494" },
      ],
    },
    {
      chip: "Gym opening",
      icon: "dumbbell",
      area: "Park Slope",
      brief:
        "We're opening a gym in Park Slope next month. I want adults 25–40 who live within a mile. Around $2,000.",
      plan: [
        { icon: "route", label: "Routes", value: "9 routes · 6,410 homes" },
        { icon: "users", label: "Audience match", value: "Age 25–40 · within 1 mile" },
        { icon: "calendar", label: "Best timing", value: "Lands the week before opening" },
        { icon: "receipt", label: "Estimated cost", value: "$1,987" },
      ],
    },
    {
      chip: "Fall menu",
      icon: "utensils",
      area: "Astoria",
      brief:
        "My restaurant in Astoria has a new fall menu. I want couples and families nearby. Budget about $1,000.",
      plan: [
        { icon: "route", label: "Routes", value: "4 routes · 3,180 homes" },
        { icon: "users", label: "Audience match", value: "Age 30–54 · households of 2+" },
        { icon: "calendar", label: "Best timing", value: "Lands Friday, ahead of dinner plans" },
        { icon: "receipt", label: "Estimated cost", value: "$986" },
      ],
    },
  ],
  steps: ["Reading your brief", "Finding routes in {area}", "Matching demographics", "Estimating cost and timing"],
  capabilities: [
    { icon: "pin", title: "AI-optimized routes", body: "Our agents suggest the best routes for the audience you describe." },
    { icon: "planning", title: "Agentic planning", body: "Recommendations for targeting, timing and spend, before you launch." },
    { icon: "palette", title: "AI creative review", body: "Creative Studio checks your design and suggests fixes before it prints." },
  ],
} as const

// Facts checked against oppizi.com and eddm.com (Sept 2026).
export const features = [
  { icon: "map", title: "Map-based targeting", body: "Choose exactly which streets and neighborhoods hear from you." },
  { icon: "users", title: "Real demographics", body: "Filter routes by age, income and household size to reach the right homes." },
  { icon: "printer", title: "Printed locally", body: "Printed within 50 miles of your campaign by our network of 700+ print partners." },
  { icon: "truck", title: "USPS drop-off handled", body: "We prepare the paperwork and deliver bundles to the post office." },
  { icon: "chart", title: "Track your results", body: "Follow delivery live, then see scans, calls and visits by neighborhood." },
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

// Facts checked against oppizi.com and eddm.com (Sept 2026).
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
    a: "Most campaigns land in mailboxes within 7–14 business days nationally, and 2–5 business days for highly local campaigns. Once your campaign goes live, printing and USPS submission are handled automatically, and you can follow every step in your dashboard.",
  },
  {
    q: "Can I choose who receives my mail?",
    a: "You choose carrier routes, not individual people. Filter routes by demographics like age, income and household size, or describe your ideal customer and our AI agents suggest the best routes for you.",
  },
  {
    q: "Can EDDM campaign results be tracked?",
    a: "Yes. Add a QR code, promo code, dedicated landing page or call tracking number to your postcard, and every scan, visit, call or redemption is tied back to your campaign. Your dashboard shows delivery status and results by neighborhood, so you know where to mail next.",
  },
  {
    q: "Who should use Every Door Direct Mail?",
    a: "Any business that serves a local area: restaurants, real estate agents, salons, florists, gyms, retail stores and home service providers. It works especially well for grand openings, limited-time offers and building awareness in a new neighborhood.",
  },
  {
    q: "Do I need a design?",
    a: "No. Start from a USPS-compliant template in our design tool, which gives AI suggestions as you go, or upload your own artwork. Either way, we check it meets USPS requirements before it prints.",
  },
]
