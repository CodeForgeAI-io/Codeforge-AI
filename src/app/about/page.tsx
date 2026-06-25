import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { InfoLayout } from "@/components/shared/info-layout";
import { Building2, Code2, Heart, Mail, Phone, Rocket, Sparkles, Target } from "@/components/icons";

export const metadata: Metadata = {
  title: `About Us — ${APP_NAME}`,
  description:
    "CodeForge AI is an AI-powered coding interview preparation platform, built by Setups Works.",
};

const VALUES = [
  { icon: Target, title: "Outcome-focused", text: "Everything we build is aimed at one thing — getting you interview-ready faster." },
  { icon: Sparkles, title: "AI-first", text: "We pair classic practice with AI mentoring, reviews and personalized plans." },
  { icon: Rocket, title: "Always improving", text: "We ship fast and listen — new tools, problems and fixes land every week." },
];

export default function AboutPage() {
  return (
    <InfoLayout>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight text-primary">
        <span className="size-1.5 rounded-full bg-primary" /> About us
      </span>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        Building the fastest path to your next offer
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {APP_NAME} is an AI-powered coding interview preparation platform. We bring together a
        deep problem bank, an instant multi-language compiler, AI mentoring, spaced repetition,
        skill analytics, contests and a community — so you can practice smarter and walk into
        interviews with confidence.
      </p>

      {/* mission */}
      <section className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-bold">Our mission</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Great engineering opportunities shouldn&apos;t hinge on who can afford the most expensive
          prep. We&apos;re making world-class, AI-assisted interview preparation accessible to
          everyone — with a powerful free tier and affordable plans for those who want more.
        </p>
      </section>

      {/* values */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-card p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-4.5 text-primary" />
            </span>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      {/* company */}
      <section className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="text-lg font-bold">The company</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {APP_NAME} (codeforgeai.io) is a product of <strong className="text-foreground">Setups Works</strong>,
          an independent software studio. It is designed, built and maintained by{" "}
          <strong className="text-foreground">Nitheesh Rajendran</strong>.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <Code2 className="mt-0.5 size-4 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developer</dt>
              <dd className="text-sm font-medium">Nitheesh Rajendran</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <Building2 className="mt-0.5 size-4 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</dt>
              <dd className="text-sm font-medium">Setups Works</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <Mail className="mt-0.5 size-4 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</dt>
              <dd className="text-sm font-medium">
                <a href="mailto:info@codeforgeai.io" className="hover:text-primary">info@codeforgeai.io</a>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <Phone className="mt-0.5 size-4 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</dt>
              <dd className="text-sm font-medium">
                <a href="tel:+916383984698" className="hover:text-primary">+91 63839 84698</a>
              </dd>
            </div>
          </div>
        </dl>
      </section>

      {/* cta */}
      <section className="mt-8 flex flex-col items-center gap-3 rounded-2xl border bg-primary/5 p-8 text-center">
        <Heart className="size-5 fill-red-500 text-red-500" />
        <h2 className="text-lg font-bold">Want to talk to us?</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          We&apos;d love to hear your feedback, partnership ideas or questions.
        </p>
        <Link
          href="/contact"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Contact us
        </Link>
      </section>
    </InfoLayout>
  );
}
