'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-white/90 font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Critical Error</h1>
            <p className="text-white/50 mb-8 leading-relaxed">
              A critical error occurred. Please reload the page.
            </p>
            <button onClick={() => reset()} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-glow-red active:scale-[0.98]">
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
