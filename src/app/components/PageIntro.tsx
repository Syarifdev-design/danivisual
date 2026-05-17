interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="border-b border-border-line bg-background-soft px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-10 bg-premium-beige" />
            <span className="text-[0.64rem] font-semibold uppercase tracking-[0.34em] text-premium-beige">
              {eyebrow}
            </span>
            <span className="h-px w-10 bg-premium-beige" />
          </div>
          <h1 className="max-w-3xl text-[2.75rem] leading-[0.94] sm:text-[4rem] lg:text-[4.8rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
