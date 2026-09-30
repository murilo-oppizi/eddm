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
      steps: ["Reading your results", "Comparing routes in Astoria", "Spotting what worked", "Weighing your options"],
      summary: "Next mailing optimized",
      choice: {
        prompt: "Two ways to improve it. Which do you prefer?",
        options: [
          {
            title: "Double down",
            detail: "Mail your 3 best routes again, plus 4 similar ones.",
            meta: "7 routes · 5,120 homes · $1,587",
            recommended: true,
            plan: [
              { icon: "trending", label: "What worked", value: "3 routes drove 70% of scans" },
              { icon: "ban", label: "Drop", value: "2 routes with no scans" },
              { icon: "route", label: "Next mailing", value: "Your 3 best + 4 similar routes" },
              { icon: "receipt", label: "Estimated cost", value: "5,120 homes · $1,587" },
            ],
          },
          {
            title: "Try a new area",
            detail: "Test Long Island City, next door, with the same audience.",
            meta: "6 routes · 4,700 homes · $1,457",
            recommended: false,
            plan: [
              { icon: "trending", label: "What worked", value: "Bigger households scanned most" },
              { icon: "route", label: "Next mailing", value: "6 routes in Long Island City" },
              { icon: "flask", label: "Keep testing", value: "Same postcard, a new QR code" },
              { icon: "receipt", label: "Estimated cost", value: "4,700 homes · $1,457" },
            ],
          },
        ],
      },
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
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Opening day", who: "Every home within a mile", when: "Two weeks before you open", offer: "A first-visit treat" },
        { title: "A new menu", who: "The streets you deliver to", when: "The week it launches", offer: "A taste of what's new" },
        { title: "Quiet nights", who: "The homes closest to you", when: "Early in the week", offer: "A weeknight deal" },
      ],
      icon: "restaurant",
      tone: "warning",
      body: "Announce a new menu or an opening to every home within delivery distance.",
      postcard: { business: "Luna Café", headline: "Our fall menu is here", offer: "Free pastry with any coffee", cta: "Scan for the menu" },
    },
    {
      name: "Real estate agents",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Just listed", who: "The blocks around the listing", when: "The day it goes live", offer: "An open-house invite" },
        { title: "Just sold", who: "The surrounding streets", when: "Right after closing", offer: "What homes sell for here" },
        { title: "Market update", who: "Your farm area", when: "Every quarter", offer: "A free valuation" },
      ],
      icon: "realEstate",
      tone: "info",
      body: "Farm your neighborhood with just-listed and just-sold cards that keep you top of mind.",
      postcard: { business: "Rivera Realty", headline: "Just sold on your street", offer: "Curious what your home is worth?", cta: "Scan for a free valuation" },
    },
    {
      name: "Salons and spas",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "New in town", who: "Every home nearby", when: "Your opening month", offer: "A first-visit discount" },
        { title: "Quiet weekdays", who: "The homes close by", when: "Tuesday to Thursday", offer: "A midweek offer" },
        { title: "Gift season", who: "Your best streets", when: "Before the holidays", offer: "Gift cards" },
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
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Before the season", who: "Homeowners nearby", when: "Weeks before the heat or cold", offer: "A tune-up price" },
        { title: "Older homes", who: "Streets of older houses", when: "Spring and fall", offer: "A free inspection" },
        { title: "After a storm", who: "The streets it hit", when: "Within days", offer: "A free check-up" },
      ],
      icon: "homeServices",
      tone: "success",
      body: "Reach homeowners right before the season hits: HVAC, roofing, cleaning, landscaping.",
      postcard: { business: "Brightside HVAC", headline: "Spring AC tune-up, $79", offer: "Beat the first heat wave", cta: "Scan to schedule" },
    },
    {
      name: "Gyms and fitness",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "New Year", who: "Everyone nearby", when: "Late December", offer: "A free first week" },
        { title: "New location", who: "Homes a short drive away", when: "Before the doors open", offer: "A founding-member rate" },
        { title: "Back to routine", who: "Nearby homes", when: "Early September", offer: "An intro class pass" },
      ],
      icon: "gym",
      tone: "ai",
      body: "Launch a new location or a new class with a free pass for the neighborhood.",
      postcard: { business: "Forge Fitness", headline: "Your first week is on us", offer: "Now open on 5th Avenue", cta: "Scan to claim your pass" },
    },
    {
      name: "Retail stores",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Grand opening", who: "Every home around the store", when: "The week before", offer: "An opening-weekend deal" },
        { title: "Seasonal sale", who: "Nearby homes", when: "Before the big shopping weeks", offer: "A sale preview" },
        { title: "New collection", who: "Your best neighborhoods", when: "Launch week", offer: "Early access" },
      ],
      icon: "retail",
      tone: "neutral",
      body: "Bring foot traffic to a grand opening, a seasonal sale or a new collection.",
      postcard: { business: "Maple & Co.", headline: "Grand opening Saturday", offer: "20% off everything, all weekend", cta: "Scan for directions" },
    },
    {
      name: "Dentists and clinics",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "New patients", who: "Families within a short drive", when: "Whenever you have openings", offer: "A free first exam" },
        { title: "Back to school", who: "The homes around the practice", when: "Late summer", offer: "A checkup and cleaning deal" },
        { title: "Year-end benefits", who: "Your nearby neighborhoods", when: "October and November", offer: "A reminder to use them" },
      ],
      icon: "dental",
      tone: "sky",
      body: "Welcome new patients and fill the calendar with checkups and cleanings.",
      postcard: { business: "Bright Smile Dental", headline: "New patients welcome", offer: "Free exam with your first cleaning", cta: "Scan to book" },
    },
    {
      name: "Auto repair",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Before winter", who: "Drivers nearby", when: "October", offer: "A winter check" },
        { title: "Road-trip season", who: "Homes within a few miles", when: "Late spring", offer: "A trip-ready inspection" },
        { title: "A new shop", who: "Every home around the garage", when: "Your opening month", offer: "A first-service discount" },
      ],
      icon: "autoRepair",
      tone: "orange",
      body: "Get cars into the bay before winter, road trips and inspection season.",
      postcard: { business: "Main St Auto", headline: "Oil change, $29.99", offer: "Free tire check included", cta: "Scan to book a slot" },
    },
    {
      name: "Pet care",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Grand opening", who: "Every home nearby", when: "Two weeks before you open", offer: "A first-visit discount" },
        { title: "Spring checkups", who: "Nearby homes", when: "Early spring", offer: "A wellness-visit deal" },
        { title: "Holiday boarding", who: "The homes close by", when: "Before the holidays", offer: "An early-booking rate" },
      ],
      icon: "pets",
      tone: "rose",
      body: "Groomers, vets and sitters: meet the pet owners on every nearby street.",
      postcard: { business: "Happy Tails", headline: "First groom, 20% off", offer: "Baths, trims and nail care", cta: "Scan to book" },
    },
    {
      name: "Landscaping and lawn care",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Spring cleanup", who: "Homeowners nearby", when: "Late winter", offer: "A cleanup price" },
        { title: "Fall leaves", who: "The same streets", when: "September", offer: "A leaf-removal deal" },
        { title: "Neighbor deal", who: "Streets you already serve", when: "Mid-season", offer: "A same-street discount" },
      ],
      icon: "landscaping",
      tone: "lime",
      body: "Line up the season's clients before the first mow.",
      postcard: { business: "Greenline Lawns", headline: "Spring cleanup, $99", offer: "Free quote, same-week start", cta: "Scan for a quote" },
    },
    {
      name: "Tutoring and schools",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "Back to school", who: "Homes near the center", when: "August", offer: "A free first session" },
        { title: "Exam season", who: "Nearby neighborhoods", when: "Before finals", offer: "A study-pack price" },
        { title: "Summer camp", who: "Homes within a short drive", when: "Early spring", offer: "Early-bird enrollment" },
      ],
      icon: "school",
      tone: "indigo",
      body: "Fill classes and tutoring slots with families in your area.",
      postcard: { business: "Bright Minds Tutoring", headline: "Ace the new school year", offer: "First session free", cta: "Scan to enroll" },
    },
    {
      name: "Events and nonprofits",
      // Draft copy, from typical EDDM advice (what to mail, to whom, when): review before launch.
      // The moments to mail: who gets it, when, and the offer.
      moments: [
        { title: "An event", who: "Every home nearby", when: "Three weeks before", offer: "Free entry or a raffle" },
        { title: "A fundraiser", who: "The streets you serve", when: "Giving season", offer: "A way to donate" },
        { title: "Volunteers", who: "Homes around the site", when: "A month ahead", offer: "A sign-up link" },
      ],
      icon: "community",
      tone: "teal",
      body: "Bring the neighborhood to a fundraiser, a fair or a food drive.",
      postcard: { business: "Riverside Community Fund", headline: "Join us at the fall fair", offer: "Food, music and games, free entry", cta: "Scan for details" },
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
export const about = {
  description:
    "EDDM is Every Door Direct Mail by Oppizi, the offline marketing platform that plans, launches and measures campaigns for brands like DoorDash, Uber Eats and Chipotle.",
  eyebrow: "About",
  title: "Every door, powered by Oppizi",
  body: "EDDM helps businesses that serve a neighborhood reach every home on the routes they choose. It's built and run by Oppizi, the offline marketing platform growth teams use to plan, launch and measure direct mail, inserts and flyering.",
  story: {
    title: "From flyers in Sydney to AI agents in New York",
    paragraphs: [
      "Oppizi started in Sydney in 2014 as a flyering company. Over the next decade it grew into a dozen countries across Europe, the Americas and Asia-Pacific, adding direct mail and package inserts along the way.",
      "Today Oppizi is headquartered in New York, and its platform uses AI agents to plan, launch and measure offline campaigns, with the targeting and tracking teams expect from digital channels.",
      "EDDM brings the same tools to local businesses: pick routes on a map, design your postcard, and we print it near your neighborhood and hand it to USPS.",
    ],
  },
  facts: [
    { value: "2014", label: "Founded, in Sydney" },
    { value: "New York", label: "Headquarters" },
    { value: "700+", label: "Local print partners in the US" },
    { value: "Oppizi OS", label: "The platform behind EDDM" },
  ],
  valuesTitle: "What we believe",
  valuesBody: "Four ideas guide how Oppizi builds, and how EDDM works for you.",
  values: [
    {
      icon: "sparkles",
      title: "Agents should power execution",
      body: "Our AI agents do the legwork of planning, from finding routes to matching your audience and estimating cost, so a mailing takes minutes to plan, not days.",
    },
    {
      icon: "mail",
      title: "Attention is earned, not bought",
      body: "A postcard in hand gets looked at. We help you design one worth keeping and send it to the neighborhoods that matter to your business.",
    },
    {
      icon: "chart",
      title: "Offline should be measurable",
      body: "Every campaign comes with QR code and scan tracking by route, so you can see what worked and where to mail next.",
    },
    {
      icon: "shield",
      title: "Scale should not break quality",
      body: "One neighborhood or a whole city, every campaign gets the same USPS checks, local printing and delivery you can follow.",
    },
  ],
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
