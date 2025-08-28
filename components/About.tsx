import { FilePlus2, Share2, Shield, Rocket } from "lucide-react";

export default function About() {
  return (
    <section className="relative px-6 md:px-12 lg:px-24 py-20">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Copy */}
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-black px-3 py-1 text-xs tracking-wide text-gray-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
            About Second Brain
          </span>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-white">
            A private, unified place for everything you want to remember.
          </h2>

          <p className="mt-4 text-base md:text-lg text-gray-300 leading-relaxed">
            Second Brain helps you capture notes, tweets, files, videos, and links—without friction.
            Keep it for yourself or share a curated view with others. Fast, focused, and built for the way you think.
          </p>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4">
              <div className="flex items-center gap-3">
                <FilePlus2 className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-white">Capture everything</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Drop in notes, links, tweets, files, and videos—no format barriers.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-white">Built for speed</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Minimal UI, instant search, and tags so you find things fast.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-white">Selective sharing</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Share your “brain” via a link—only the notes you choose.
              </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-white">Private by default</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Your data stays yours. Strong permissions and export anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Visual card (contrasts with hero image) */}
        <div className="lg:col-span-5">
          <div className="relative">
            {/* Soft accent glow */}
            <div className="pointer-events-none absolute -inset-16 rounded-[2rem] bg-gradient-to-t from-indigo-500/10 via-fuchsia-500/10 to-transparent blur-3xl" />
            {/* Mock app block */}
            <div className="relative rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Your Brain</div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="text-xs text-gray-400">Private</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Notes", "Tweets", "Files", "Videos", "Links", "Tags"].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-center text-xs text-gray-300"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-gray-800 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">Share your brain</div>
                  <span className="rounded-md border border-gray-800 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400">
                    View-only
                  </span>
                </div>
                <div className="mt-3 h-10 rounded-md bg-black/50 ring-1 ring-inset ring-gray-800 flex items-center px-3 text-xs text-gray-500">
                  https://secondbrain.app/gaurav-brain
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Only selected notes are visible to viewers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
