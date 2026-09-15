export function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-background">
      <div className="relative h-full w-full">
        <div className="absolute -top-40 -left-40 h-96 w-96 animate-blob rounded-full bg-primary/30 opacity-50 filter blur-3xl dark:blur-4xl"></div>
        <div className="animation-delay-2000 absolute -bottom-40 right-10 h-96 w-96 animate-blob rounded-full bg-accent/30 opacity-50 filter blur-3xl dark:blur-4xl"></div>
        <div className="animation-delay-4000 absolute -bottom-20 left-20 h-80 w-80 animate-blob rounded-full bg-primary/20 opacity-40 filter blur-2xl dark:blur-3xl"></div>
      </div>
    </div>
  );
}
