import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PainPoints } from "@/components/pain-points";
import { Impact } from "@/components/impact";
import { ComparisonTable } from "@/components/comparison-table";
import { SavingsCalculator } from "@/components/savings-calculator";
import { HowItWorks } from "@/components/how-it-works";
import { Privacy } from "@/components/privacy";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { Section } from "@/components/section";
import { ScrollTracker } from "@/components/scroll-tracker";
import { TimeTracker } from "@/components/time-tracker";
import { SITE_URL } from "@/lib/blog";

/**
 * Site-level structured data: what the site is, and what the tool is. Helps
 * search engines understand the product page as an application rather than a
 * generic marketing page.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Autocropper",
      description:
        "Crop and resize one logo into a full icon set — every size from 16 to 512 px, entirely in your browser.",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Autocropper",
      url: SITE_URL,
    },
    {
      "@type": "SoftwareApplication",
      name: "Autocropper",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (web browser)",
      url: SITE_URL,
      description:
        "Turn any logo into a perfect icon set. Auto-cropping, background removal and every size from 16 to 512 px, processed locally in the browser.",
      featureList: [
        "Logo-aware automatic cropping",
        "Background removal",
        "Icon sizes 16 to 512 px in one pass",
        "Client-side processing — images are never uploaded",
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <ScrollTracker />
      <TimeTracker />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main id="hero-tool" className="flex-1">
        <Hero />

        <Section
          id="pain"
          trackId="pain_points"
          eyebrow="The old way"
          title={<>The 5-tool, 15-minute logo workflow you didn&apos;t sign up for</>}
          description="Generating clean app icons today means duct-taping a chain of single-purpose tools. Each tool slows you down, charges you, and degrades quality."
        >
          <PainPoints />
        </Section>

        <Section
          id="impact"
          trackId="impact"
          eyebrow="The new way"
          title={<>From 5 tools and 15 minutes to one drag-and-drop</>}
          description="Autocropper collapses the entire workflow into a single in-browser pipeline. Same output, ~150× faster."
        >
          <Impact />
        </Section>

        <Section
          id="how-it-works"
          trackId="how_it_works"
          eyebrow="How it works"
          title={<>Three steps. Zero ceremony.</>}
          description="No accounts, no API keys, no subscriptions to start. Drop a logo, get an icon set, move on."
        >
          <HowItWorks />
        </Section>

        <Section
          id="compare"
          trackId="comparison_table"
          eyebrow="Side by side"
          title={<>Autocropper vs the manual workflow</>}
          description="What it actually costs you to ship icons today — versus what it costs with Autocropper."
        >
          <ComparisonTable />
        </Section>

        <Section
          id="calculator"
          trackId="savings_calculator"
          eyebrow="ROI calculator"
          title={<>What does the manual workflow cost you?</>}
          description="Move the slider to your real volume. The numbers add up faster than you think."
        >
          <SavingsCalculator />
        </Section>

        <Section
          id="privacy"
          trackId="privacy"
          eyebrow="Privacy by design"
          title={<>Your images never leave your device</>}
          description="Autocropper has no upload endpoint. Period. Open the browser network tab and watch — nothing leaves."
        >
          <Privacy />
        </Section>

        <Section
          id="pricing"
          trackId="pricing"
          eyebrow="Pricing"
          title={<>Simple. Honest. Cheaper than one missed lunch.</>}
          description="Free for casual use. 5 CHF/month for unlimited, custom sizes and bulk export."
        >
          <Pricing />
        </Section>

        <Section
          id="faq"
          trackId="faq"
          eyebrow="FAQ"
          title={<>Common questions</>}
          description="If anything's missing, ping us at business.promptin@gmail.com."
        >
          <FAQ />
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
