import Image from "next/image";
import { cn } from "../lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/assets/SECONDbrain_logo.png"
      alt="SecondBrain Logo"
      width={120} // adjust size
      height={40} // adjust size
      className={cn("h-auto w-auto", className)}
      priority
    />
  );
};

export const LogoIcon = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/assets/SECONDbrain_logo.png"
      alt="SecondBrain Icon"
      width={40}
      height={40}
      className={cn("h-auto w-auto", className)}
    />
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/assets/SECONDbrain_logo.png"
      alt="SecondBrain Stroke Logo"
      width={60}
      height={60}
      className={cn("h-auto w-auto", className)}
    />
  );
};
