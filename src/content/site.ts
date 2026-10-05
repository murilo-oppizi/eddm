// All homepage copy lives here so it can be edited without touching layout code.
// Numbers and claims are placeholders — confirm with marketing before launch.

export const site = {
  name: "EDDM",
  tagline: "Every Door Direct Mail, made simple.",
  description:
    "Reach every home in the neighborhoods you choose. Pick routes on a map, design your postcard, and we handle printing and USPS delivery.",
  // Homepage sections, linked from "/" so the links also work from the other pages.
  nav: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Why EDDM", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  primaryCta: { label: "Start a campaign", href: "/#get-started" },
  secondaryCta: { label: "See pricing", href: "/#pricing" },
  // The same Oppizi app login the live eddm.com links to.
  login: { label: "Log in", href: "https://app.oppizi.com/login?oppizi_source=eddm" },
}

// The closing card. Its button opens the Oppizi app, where a campaign is made (the link
// oppizi.com's own "Launch a campaign" buttons use). The line is
// the closing card's on oppizi.com's EDDM page (Oct 2026).
export const cta = {
  title: "Ready to reach every door?",
  body: "Reach every household in your target area, launch in minutes, and track delivery and performance in one place.",
  button: { label: "Launch a campaign", href: "https://app.oppizi.com/?oppizi_source=eddm" },
}

export const hero = {
  eyebrow: "USPS Every Door Direct Mail®",
  title: "Put your business in every mailbox on the block.",
  body: "No mailing lists, no guesswork. Choose the neighborhoods you want on a map, upload or design your postcard, and we print and deliver it to USPS for you.",
  checks: ["USPS-compliant", "No mailing list needed", "Built-in AI agents"],
}

// Client logos and numbers from oppizi.com (Sept 2026). The numbers are Oppizi-wide,
// across all offline channels, not EDDM only. Logos: oppizi.com/brand/clients/*.svg.
export const trust = {
  label: "Trusted by growth teams at",
  clients: [
    { name: "DoorDash", src: "/brand/clients/doordash.svg", width: 241, height: 29 },
    { name: "Uber Eats", src: "/brand/clients/uber.svg", width: 160, height: 28 }, // the file is the Uber Eats wordmark
    { name: "Chipotle", src: "/brand/clients/chipotle.svg", width: 191, height: 37 },
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

// Four steps, as on oppizi.com (select routes, design, launch, track) — eddm.com lists
// the same flow. The visuals in how-it-works.tsx use illustrative numbers.
export const steps = [
  {
    title: "Pick your neighborhoods",
    body: "Search a ZIP code or address and select carrier routes on the map. See household counts and demographics as you go.",
  },
  {
    title: "Design your postcard",
    body: "Start from a USPS-ready template or upload your own artwork. We check it meets USPS size rules before it prints.",
  },
  {
    title: "We print and deliver",
    body: "We print, bundle and drop your mail at the post office. Your mail carrier delivers it to every door on the route.",
  },
  {
    title: "Track your results",
    body: "Follow every stage in your dashboard, then see scans, calls and visits by neighborhood, so you know where to mail next.",
  },
]

// "AI planning" section. The scenarios are illustrative examples. Every cost = homes × $0.31.
export const aiPlanning = {
  eyebrow: "AI planning",
  title: "Tell us your goal. Our agents plan the campaign.",
  body: "Describe your business in plain words and get routes, timing and budget in seconds.",
  placeholder: "Describe your business, who you want to reach and your budget…",
  // Three kinds of ask: launching a campaign, finding routes (answered on a map), and
  // learning from results. The last one stops for the visitor to pick between two options.
  scenarios: [
    {
      chip: "New campaign",
      icon: "rocket",
      area: "Williamsburg",
      brief:
        "I run a coffee shop in Williamsburg. I want young families within walking distance. Budget around $1,500.",
      steps: ["Reading your brief", "Finding routes in Williamsburg", "Matching demographics", "Estimating cost and timing"],
      summary: "Plan ready",
      plan: [
        { icon: "route", label: "Routes", value: "6 routes · 4,820 homes" },
        { icon: "users", label: "Audience match", value: "Age 25–44 · 3+ residents" },
        { icon: "calendar", label: "Best timing", value: "Lands Thursday, before the weekend" },
        { icon: "receipt", label: "Estimated cost", value: "$1,494" },
      ],
    },
    {
      chip: "Find the best routes",
      icon: "mapSearch",
      area: "Bay Ridge",
      brief:
        "I only have budget for 3 routes. Which ones near my dental clinic in Bay Ridge have the most families with kids?",
      steps: ["Reading your question", "Profiling patients like yours", "Scoring routes in Bay Ridge", "Picking the top 3"],
      summary: "Your best 3 routes",
      // Answered on a map: the three best routes, each with its match score.
      map: {
        homes: "3,940 homes",
        caption: "Match with households of 3+ residents, age 25–54",
        matches: ["92%", "84%", "78%"],
      },
    },
    {
      chip: "Learn from past campaigns",
      icon: "trending",
      area: "Astoria",
      brief: "My Astoria mailing got 212 scans. What should I change for the next one?",
      steps: ["Reading your results", "Comparing routes in Astoria", "Spotting what worked", "Planning your next mailing"],
      summary: "Next mailing optimized",
      plan: [
        { icon: "trending", label: "What worked", value: "3 routes drove 70% of scans" },
        { icon: "ban", label: "Drop", value: "2 routes with no scans" },
        { icon: "route", label: "Next mailing", value: "Your 3 best + 4 similar routes" },
        { icon: "receipt", label: "Estimated cost", value: "5,120 homes · $1,587" },
      ],
    },
  ],
} as const

// "Who it's for". Industries and use cases from eddm.com / oppizi.com (Sept 2026); the
// postcard offers are illustrative examples of what each business might mail.
export const audiences = {
  eyebrow: "Who it's for",
  title: "Built for businesses that serve a neighborhood",
  body: "If your customers live nearby, EDDM puts you in their mailbox.",
  industries: [
    {
      name: "Restaurants and cafés",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Opening day", headline: "Now open on your block", offer: "A free pastry on your first visit" },
        { title: "A new menu", headline: "Our fall menu is here", offer: "Free pastry with any coffee" },
        { title: "Quiet nights", headline: "Tuesday nights, 2 for 1", offer: "Any pasta, every Tuesday" },
      ],
      icon: "restaurant",
      tone: "warning",
      body: "Announce a new menu or an opening to every home within delivery distance.",
      postcard: { business: "Luna Café", headline: "Our fall menu is here", offer: "Free pastry with any coffee", cta: "Scan for the menu" },
    },
    {
      name: "Real estate agents",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Just listed", headline: "Just listed on Maple Ave", offer: "Open house this Sunday, 1 to 4 pm" },
        { title: "Just sold", headline: "Just sold on your street", offer: "Curious what your home is worth?" },
        { title: "Market update", headline: "Your neighborhood, this quarter", offer: "See what homes sold for nearby" },
      ],
      icon: "realEstate",
      tone: "info",
      body: "Farm your neighborhood with just-listed and just-sold cards that keep you top of mind.",
      postcard: { business: "Rivera Realty", headline: "Just sold on your street", offer: "Curious what your home is worth?", cta: "Scan for a free valuation" },
    },
    {
      name: "Salons and spas",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "New in town", headline: "Your first visit, 30% off", offer: "Cuts, color and facials" },
        { title: "Quiet weekdays", headline: "A midweek glow-up", offer: "20% off, Tuesday to Thursday" },
        { title: "Gift season", headline: "Give the gift of a day off", offer: "Gift cards in any amount" },
      ],
      icon: "salon",
      // Cyan, not the brand pink: on the map, pink is "Your business".
      tone: "cyan",
      body: "Fill quiet weekdays with a first-visit offer for everyone nearby.",
      postcard: { business: "Studio Nine", headline: "Your first visit, 30% off", offer: "Cuts, color and facials", cta: "Scan to book" },
    },
    {
      name: "Home services",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Before the season", headline: "Spring AC tune-up, $79", offer: "Beat the first heat wave" },
        { title: "Older homes", headline: "Older home? Free inspection", offer: "Wiring, pipes and heating, checked" },
        { title: "After a storm", headline: "Storm damage? We're nearby", offer: "A free check-up this week" },
      ],
      icon: "homeServices",
      tone: "success",
      body: "Reach homeowners right before the season hits: HVAC, roofing, cleaning, landscaping.",
      postcard: { business: "Brightside HVAC", headline: "Spring AC tune-up, $79", offer: "Beat the first heat wave", cta: "Scan to schedule" },
    },
    {
      name: "Gyms and fitness",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "New Year", headline: "New year, first week free", offer: "Classes, weights and coaching" },
        { title: "New location", headline: "Now open on 5th Avenue", offer: "Founding-member rates this month" },
        { title: "Back to routine", headline: "Back to your routine", offer: "An intro class pass, on us" },
      ],
      icon: "gym",
      tone: "ai",
      body: "Launch a new location or a new class with a free pass for the neighborhood.",
      postcard: { business: "Forge Fitness", headline: "Your first week is on us", offer: "Now open on 5th Avenue", cta: "Scan to claim your pass" },
    },
    {
      name: "Retail stores",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Grand opening", headline: "Grand opening Saturday", offer: "20% off everything, all weekend" },
        { title: "Seasonal sale", headline: "Our biggest sale of the season", offer: "Up to 40% off, this week only" },
        { title: "New collection", headline: "The new collection is in", offer: "Early access for neighbors" },
      ],
      icon: "retail",
      tone: "neutral",
      body: "Bring foot traffic to a grand opening, a seasonal sale or a new collection.",
      postcard: { business: "Maple & Co.", headline: "Grand opening Saturday", offer: "20% off everything, all weekend", cta: "Scan for directions" },
    },
    {
      name: "Dentists and clinics",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "New patients", headline: "New patients welcome", offer: "Free exam with your first cleaning" },
        { title: "Back to school", headline: "Back-to-school smiles", offer: "A checkup and cleaning for kids" },
        { title: "Year-end benefits", headline: "Use your benefits this year", offer: "Book before December 31" },
      ],
      icon: "dental",
      tone: "sky",
      body: "Welcome new patients and fill the calendar with checkups and cleanings.",
      postcard: { business: "Bright Smile Dental", headline: "New patients welcome", offer: "Free exam with your first cleaning", cta: "Scan to book" },
    },
    {
      name: "Auto repair",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Before winter", headline: "Get winter-ready", offer: "Battery, tires and brakes checked" },
        { title: "Road-trip season", headline: "Road-trip ready?", offer: "A 30-point inspection, $49" },
        { title: "A new shop", headline: "Now open on Main St", offer: "Your first oil change, $29.99" },
      ],
      icon: "autoRepair",
      tone: "orange",
      body: "Get cars into the bay before winter, road trips and inspection season.",
      postcard: { business: "Main St Auto", headline: "Oil change, $29.99", offer: "Free tire check included", cta: "Scan to book a slot" },
    },
    {
      name: "Pet care",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Grand opening", headline: "First groom, 20% off", offer: "Baths, trims and nail care" },
        { title: "Spring checkups", headline: "Spring checkup time", offer: "A wellness visit for $39" },
        { title: "Holiday boarding", headline: "Book their holiday stay", offer: "Early-booking rates for boarding" },
      ],
      icon: "pets",
      tone: "rose",
      body: "Groomers, vets and sitters: meet the pet owners on every nearby street.",
      postcard: { business: "Happy Tails", headline: "First groom, 20% off", offer: "Baths, trims and nail care", cta: "Scan to book" },
    },
    {
      name: "Landscaping and lawn care",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Spring cleanup", headline: "Spring cleanup, $99", offer: "Free quote, same-week start" },
        { title: "Fall leaves", headline: "Leave the leaves to us", offer: "Fall cleanup from $119" },
        { title: "Neighbor deal", headline: "We're already on your street", offer: "15% off for neighbors" },
      ],
      icon: "landscaping",
      tone: "lime",
      body: "Line up the season's clients before the first mow.",
      postcard: { business: "Greenline Lawns", headline: "Spring cleanup, $99", offer: "Free quote, same-week start", cta: "Scan for a quote" },
    },
    {
      name: "Tutoring and schools",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Back to school", headline: "Ace the new school year", offer: "First session free" },
        { title: "Exam season", headline: "Finals are coming", offer: "A study pack for every subject" },
        { title: "Summer camp", headline: "Summer camp is back", offer: "Early-bird spots now open" },
      ],
      icon: "school",
      tone: "indigo",
      body: "Fill classes and tutoring slots with families in your area.",
      postcard: { business: "Bright Minds Tutoring", headline: "Ace the new school year", offer: "First session free", cta: "Scan to enroll" },
    },
    {
      name: "Community and nonprofits",
      // From Oppizi's Public & Community clients.
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "A fundraiser", headline: "Help us feed 500 families", offer: "Every dollar stays local" },
        { title: "Volunteers", headline: "Volunteers wanted", offer: "Two hours on a Saturday" },
        { title: "A public notice", headline: "Town hall at Riverside Park", offer: "Thursday at 7 pm, all welcome" },
      ],
      icon: "community",
      tone: "teal",
      body: "Bring the neighborhood to a fundraiser, a food drive or a town hall.",
      postcard: { business: "Riverside Community Fund", headline: "Join us at the fall fair", offer: "Food, music and games, free entry", cta: "Scan for details" },
    },
    {
      name: "Events and entertainment",
      // From Oppizi's Entertainment, Media & Events clients.
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Opening night", headline: "Opening night, Friday", offer: "Two tickets for the price of one" },
        { title: "A local fair", headline: "The fall fair is back", offer: "Food, music and games, free entry" },
        { title: "Season passes", headline: "Your season pass is here", offer: "Early-bird price until May 1" },
      ],
      icon: "events",
      tone: "fuchsia",
      body: "Fill the seats for a concert, a fair or a season opener.",
      postcard: { business: "The Grand Theater", headline: "Opening night, Friday", offer: "Two tickets for the price of one", cta: "Scan for tickets" },
    },
    {
      name: "Delivery apps",
      // From Oppizi's Internet Marketplace Platforms clients (food delivery, meal kits).
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "A new zone", headline: "We now deliver here", offer: "$10 off your first order" },
        { title: "Win-back", headline: "We miss you", offer: "$8 off your next order" },
        { title: "A new category", headline: "Now delivering groceries", offer: "Free delivery on your first basket" },
      ],
      icon: "delivery",
      tone: "violet",
      body: "Launch in a new zone and win the first orders on every street in it.",
      postcard: { business: "QuickBite", headline: "We now deliver here", offer: "$10 off your first order", cta: "Scan to order" },
    },
    {
      name: "Builders and remodelers",
      // From Oppizi's Real Estate & Construction clients.
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "Job-site neighbors", headline: "Just finished on your street", offer: "Free design consultation" },
        { title: "Remodel season", headline: "Plan your spring remodel", offer: "Book by March, save 10%" },
        { title: "A new development", headline: "Coming soon: Oak Grove homes", offer: "Get a preview invite" },
      ],
      icon: "builders",
      tone: "amber",
      body: "Show your work to the neighbors of every job you finish.",
      postcard: { business: "Oak & Stone Builders", headline: "Just finished on your street", offer: "Free design consultation", cta: "Scan to see the project" },
    },
    {
      name: "Banks and tax preparers",
      // From Oppizi's Finance clients: the local ones (branches, tax offices).
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail, each with the headline and offer its flyer would carry.
      moments: [
        { title: "A new branch", headline: "A new branch, around the corner", offer: "$100 when you open an account" },
        { title: "Tax season", headline: "Tax season, sorted", offer: "A free first consultation" },
        { title: "A better rate", headline: "A better savings rate", offer: "Visit your neighborhood branch" },
      ],
      icon: "finance",
      tone: "emerald",
      body: "Bring neighbors into a new branch, or in the door before tax season.",
      postcard: { business: "Hometown Credit Union", headline: "A new branch, around the corner", offer: "$100 when you open an account", cta: "Scan to open one" },
    },
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

// Pricing calculator. Totals are what Oppizi's live EDDM cost calculator shows at these
// home counts (oppizi.com/…/every-door-direct-mail/cost-calculator, read Sept 24 2026),
// with straight lines in between (its prices rise almost linearly). They replace the
// "$0.31 · $4,650 for 15,000" from the same page's static text, which the calculator
// contradicts (47¢ · $6,987). TO CONFIRM with marketing.
export const pricing = {
  eyebrow: "Pricing",
  title: "Know your cost up front",
  body: "Printing, USPS postage and delivery, all included. No mailing lists or setup fees.",
  homes: { min: 1000, max: 30000, step: 1000, initial: 15000 },
  anchors: [1000, 5000, 10000, 15000, 20000, 30000],
  // dims and w × h are in inches (landscape); w × h draws the little size glyphs.
  sizes: [
    { name: "Small", dims: "4.25 × 11", w: 11, h: 4.25, totals: [534, 2238, 4391, 6567, 8692, 13029] },
    { name: "Standard", dims: "6.25 × 9", w: 9, h: 6.25, bestSeller: true, totals: [578, 2385, 4675, 6987, 9248, 13857] },
    { name: "Large", dims: "6.25 × 11", w: 11, h: 6.25, totals: [635, 2576, 5042, 7532, 9968, 14931] },
    { name: "Jumbo", dims: "8.25 × 11", w: 11, h: 8.25, totals: [750, 2958, 5776, 8622, 11408, 17076] },
    { name: "Oversized", dims: "15 × 12", w: 15, h: 12, totals: [1150, 4293, 8346, 12434, 16446, 24582] },
  ],
  initialSize: "Standard",
  more: "Need more than 30,000 homes?",
  cta: "Get your exact quote",
  note: "Estimates include USPS EDDM postage. Your quote confirms the final price.",
  included: [
    "700+ local print partners",
    "Demographic route targeting",
    "USPS-ready design templates",
    "Delivery and scan tracking",
  ],
} as const

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

// About page. Facts from oppizi.com (About us, homepage, imprint) and eddm.com, Sept
// 2026; the values are Oppizi's own, explained for EDDM. Confirm with marketing.
// About page. Copy from oppizi.com's About us page, homepage and imprint (Oct 2026):
// the mission, the four beliefs, the leadership team, the numbers, the countries and the
// case-study results are theirs; the EDDM lines tie them to this site. Confirm before launch.
export const about = {
  description:
    "EDDM is Every Door Direct Mail by Oppizi, the agentic offline marketing platform that plans, launches and measures campaigns for brands like DoorDash, Uber Eats and Chipotle.",
  hero: {
    eyebrow: "About Oppizi",
    title: "We're redefining how offline marketing works",
    body: "Offline shouldn't be guesswork. We built Oppizi to bring agents to offline marketing, to help plan, create and track every campaign. EDDM is how we bring it to the businesses that serve a neighborhood.",
    primary: { label: "Launch a campaign", href: "https://app.oppizi.com/?oppizi_source=eddm" },
    secondary: { label: "Join the team", href: "https://oppizi.com/us/en/work-at-oppizi/corporate-roles/" },
    // Around the postmark
    postmark: "OPPIZI · OFFLINE MARKETING · SINCE 2014 · SYDNEY → BROOKLYN · ",
    postmarkValue: "306M+",
    postmarkLabel: "pieces delivered",
  },
  story: {
    eyebrow: "Our story",
    title: "From flyers in Sydney to agents in Brooklyn",
    stops: [
      { when: "2014", where: "Sydney", title: "A flyering company", body: "Oppizi starts out on the street, putting flyers into hands for brands that want local customers." },
      { when: "Growing", where: "12+ countries", title: "Across three continents", body: "Teams on the ground in Europe, the Americas and Asia-Pacific, in 77+ cities and counting." },
      { when: "More channels", where: "One platform", title: "Mail, inserts and flyers", body: "Direct mail, Every Door Direct Mail and package inserts join flyering, planned and measured in one place." },
      { when: "Today", where: "Brooklyn, NY", title: "An agentic platform", body: "Oppizi OS uses AI agents to plan, launch and measure offline campaigns, with the precision of a digital channel." },
    ],
  },
  mission: {
    eyebrow: "Our mission",
    // The highlighted words sit between the two parts.
    before: "To transform offline marketing into an",
    highlight: "agentic performance channel",
    after: "that teams can plan, execute, and scale with confidence.",
  },
  valuesEyebrow: "What drives us",
  valuesTitle: "Four ideas behind everything we build",
  values: [
    {
      art: "agents",
      title: "Agents should power execution",
      body: "Our AI agents do the legwork, from finding routes to matching your audience and estimating cost, so a mailing takes minutes to plan, not days.",
    },
    {
      art: "attention",
      title: "Attention is earned, not bought",
      body: "Real-world interactions create focus and presence that digital channels can't replicate. A postcard in hand gets looked at.",
    },
    {
      art: "scans",
      title: "Offline should be measurable",
      body: "Marketing in the physical world should be held to the same standards as digital: every campaign tracks scans and results by route.",
    },
    {
      art: "quality",
      title: "Scale should not break quality",
      body: "One neighborhood or a whole city, every campaign gets the same USPS checks, local printing and delivery you can follow.",
    },
  ],
  world: {
    eyebrow: "Where we work",
    title: "Global, and on the ground",
    body: "Oppizi runs campaigns across 14 countries from one platform, with local teams and partners in every market.",
    // The bento's big tile, over the globe
    reach: { title: "14 countries, one platform", body: "Plan, launch and measure every market from the same dashboard." },
    countriesTitle: "Our markets",
    countriesBody: "Point at one to find it on the map.",
    // Each country's main city, for its pin on the globe: [code, name, latitude, longitude]
    regions: [
      { name: "Americas", countries: [["US", "United States", 40.68, -73.94], ["CA", "Canada", 43.65, -79.38], ["BR", "Brazil", -23.55, -46.63], ["AR", "Argentina", -34.6, -58.38]] },
      { name: "Europe", countries: [["GB", "United Kingdom", 51.51, -0.13], ["FR", "France", 48.86, 2.35], ["DE", "Germany", 52.52, 13.4], ["ES", "Spain", 40.42, -3.7], ["PT", "Portugal", 38.72, -9.14], ["NL", "Netherlands", 52.37, 4.9], ["BE", "Belgium", 50.85, 4.35], ["PL", "Poland", 52.23, 21.01]] },
      { name: "Asia-Pacific", countries: [["AU", "Australia", -33.87, 151.21], ["NZ", "New Zealand", -36.85, 174.76]] },
    ],
    hq: { label: "Headquarters", place: "Brooklyn, New York", address: "426 Union Ave, Brooklyn, NY 11211" },
    network: [
      { icon: "walk", value: "77+", label: "Cities with flyering" },
      { icon: "store", value: "400+", label: "Retail partners" },
      { icon: "printer", value: "700+", label: "US print partners" },
    ],
  },
  team: {
    eyebrow: "Sourced from around the world",
    title: "Our leadership team",
    // Portraits from oppizi.com, in public/team/ (resized to 800px, WebP)
    people: [
      { name: "Arthur Favier", role: "Founder & CEO", photo: "arthur-favier" },
      { name: "Sami Andreani", role: "CFO", photo: "sami-andreani" },
      { name: "Nicolas de Resbecq", role: "CRO", photo: "nicolas-de-resbecq" },
      { name: "Slava Tykhonchuk", role: "CTO", photo: "slava-tykhonchuk" },
      { name: "Erin Stuckert", role: "GM US", photo: "erin-stuckert" },
      { name: "Raphael Vivant", role: "GM ANZ", photo: "raphael-vivant" },
      { name: "Vincent Bonnet", role: "GM France", photo: "vincent-bonnet" },
      { name: "Gaëlle Walrave", role: "GM Germany", photo: "gaelle-walrave" },
      { name: "Silvana Sánchez", role: "GM Spain & Portugal", photo: "silvana-sanchez" },
    ],
  },
  results: {
    title: "Results that show up in the real world",
    items: [
      { brand: "Uber Eats", value: "2M+", label: "new customers acquired" },
      { brand: "Getaround", value: "70%", label: "lower cost per acquisition" },
      { brand: "THE ICONIC", value: "5.7M", label: "satchel inserts delivered" },
    ],
  },
  life: {
    eyebrow: "Life at Oppizi",
    title: "A place for people who like building real things",
    lines: [
      "You'll work across markets, teams, and disciplines.",
      "You'll see your work show up in the real world.",
      "We move fast, but with purpose.",
    ],
    tags: ["Teamwork", "Field work", "Global network"],
    primary: { label: "Join the team", href: "https://oppizi.com/us/en/work-at-oppizi/corporate-roles/" },
    secondary: { label: "Become a Brand Ambassador", href: "https://oppizi.com/us/en/work-at-oppizi/on-site-distribution-roles/" },
  },
} as const

// Contact page. Email and address from oppizi.com's imprint; the one-business-day
// reply is Oppizi's contact page promise. Confirm before launch.
export const contact = {
  description: "Questions about EDDM, or a campaign in mind? Send us a note and we'll reply within one business day.",
  eyebrow: "Contact",
  title: "Let's plan your mailing",
  body: "Tell us about your business and where you'd like to mail. We'll reply within one business day.",
  reach: {
    legend: "How many homes do you want to reach?",
    options: ["1,000–5,000", "5,000–10,000", "10,000–25,000", "25,000–50,000", "50,000+", "Not sure yet"],
  },
  channels: [
    { icon: "mail", title: "Email us", value: "contact@oppizi.com", href: "mailto:contact@oppizi.com" },
    { icon: "login", title: "Already a customer?", value: "Log in to your account", href: site.login.href },
    { icon: "help", title: "Quick answers", value: "Read the FAQ", href: "/#faq" },
  ],
  office: { title: "Our US office", lines: ["Oppizi US Inc.", "426 Union Ave", "Brooklyn, NY 11211"] },
  success: {
    title: "Thanks, {name}!",
    body: "Your message is on its way. We'll reply within one business day.",
    again: "Send another message",
  },
} as const
