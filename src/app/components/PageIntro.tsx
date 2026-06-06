interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="flex min-h-[320px] items-center border-b border-border-line bg-white px-5 py-12 sm:px-8 lg:min-h-[376px] lg:px-10 lg:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-10 bg-premium-beige" />
            <span className="text-[0.64rem] font-semibold uppercase tracking-[0.34em] text-premium-beige">
              {eyebrow}
            </span>
            <span className="h-px w-10 bg-premium-beige" />
          </div>
          <h1 className="max-w-5xl text-balance text-[2.75rem] leading-[0.94] sm:text-[4rem] lg:text-[4.6rem]">
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
