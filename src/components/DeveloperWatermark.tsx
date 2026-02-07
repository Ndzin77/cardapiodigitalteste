import { useState, useEffect } from "react";
import { Instagram, Sparkles, ArrowRight, Code2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const INSTAGRAM_PROFILE = "https://instagram.com/n4ndx.77";
const INSTAGRAM_DM = "https://ig.me/m/n4ndx.77";

// Footer watermark - integrated at bottom of page
export function FooterDeveloperBadge() {
  return (
    <div className="w-full bg-gradient-to-r from-secondary/50 via-secondary/30 to-secondary/50 border-t border-border/30 py-4 px-4">
      <div className="container flex items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          {/* Developer credit */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Code2 className="w-4 h-4 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              criado por
            </span>
            <a
              href={INSTAGRAM_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @n4ndx.77
            </a>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-4 bg-border/60" />

          {/* CTA */}
          <a
            href={INSTAGRAM_DM}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all duration-300 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>quer um site assim?</span>
            <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/50 hover:decoration-primary flex items-center gap-0.5">
              clique aqui!
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

// Floating watermark - appears periodically with smooth animation
export function FloatingDeveloperBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");

  useEffect(() => {
    // Initial delay before first appearance
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 8000);

    // Periodic visibility toggle
    const interval = setInterval(() => {
      setIsVisible(prev => {
        if (!prev) {
          // Alternate position each time it appears
          setPosition(p => p === "left" ? "right" : "left");
        }
        return !prev;
      });
    }, 12000); // Show for 12s, hide for 12s

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-700 ease-out pointer-events-none",
        position === "right" ? "right-4" : "left-4",
        "top-1/3",
        isVisible 
          ? "opacity-100 translate-x-0" 
          : position === "right" 
            ? "opacity-0 translate-x-8" 
            : "opacity-0 -translate-x-8"
      )}
    >
      <a
        href={INSTAGRAM_DM}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "pointer-events-auto group flex flex-col items-center gap-2 p-3 rounded-2xl",
          "bg-gradient-to-br from-card/95 via-card/90 to-card/80",
          "backdrop-blur-lg border border-border/40",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "hover:scale-105 hover:border-primary/30"
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon with pulse */}
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse border-2 border-card" />
        </div>

        {/* Text */}
        <div className="text-center space-y-0.5 relative z-10">
          <p className="text-[10px] text-muted-foreground font-medium leading-tight">
            site by
          </p>
          <p className="text-xs font-bold text-foreground flex items-center gap-1">
            <Instagram className="w-3 h-3" />
            n4ndx.77
          </p>
        </div>

        {/* Hover CTA */}
        <div className="overflow-hidden h-0 group-hover:h-6 transition-all duration-300">
          <p className="text-[10px] text-primary font-semibold whitespace-nowrap flex items-center gap-1">
            Quero um! <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </a>
    </div>
  );
}

// Combined component - only floating (footer badge should be placed manually in layouts)
export function DeveloperWatermarks() {
  return (
    <>
      <FloatingDeveloperBadge />
    </>
  );
}
