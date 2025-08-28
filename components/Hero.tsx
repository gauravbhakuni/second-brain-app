import Image from "next/image";
import { Button } from "./ui/button";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 md:px-12 lg:px-24 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          Your Second Brain
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Capture notes, tweets, files, videos & links in one place. Share your
          curated brain with anyone—simple, secure, and elegant.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">Get Started</Button>

          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      {/* Dashboard Preview Image */}
      <div className="mt-16 w-full max-w-6xl px-2 sm:px-6 lg:px-12">
        <Image
          src="/images/dashboard_preview.png"
          alt="Second Brain Dashboard"
          width={1400}
          height={800}
          className="w-full h-auto max-h-[600px] rounded-2xl shadow-2xl border border-gray-800"
        />
      </div>
    </section>
  );
}
