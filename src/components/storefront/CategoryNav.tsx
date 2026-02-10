import { Category } from "@/types/store";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      ref?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  useEffect(() => {
    const activeButton = scrollRef.current?.querySelector(`[data-category="${activeCategory}"]`);
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="sticky top-0 z-30">
      {/* Glass morphism background with gradient accent */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl border-b border-border/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="container py-4 relative">
        {/* Scroll arrows with premium styling */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-1"
          >
            <div className="w-9 h-9 rounded-full bg-card shadow-strong border border-border/50 flex items-center justify-center hover:scale-110 hover:shadow-glow transition-all duration-300 group">
              <ChevronLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-1"
          >
            <div className="w-9 h-9 rounded-full bg-card shadow-strong border border-border/50 flex items-center justify-center hover:scale-110 hover:shadow-glow transition-all duration-300 group">
              <ChevronRight className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 scroll-smooth"
        >
          {categories.map((category, idx) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                data-category={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 text-sm font-bold shrink-0 animate-scale-in ${
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-glow scale-[1.02]"
                    : "bg-card text-foreground border border-border/50 shadow-soft hover:shadow-medium hover:-translate-y-1 hover:border-primary/30"
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Active glow ring */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl -z-10 animate-pulse" />
                    <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-50 -z-20 blur-sm" />
                  </>
                )}
                
                {/* Icon with enhanced styling */}
                {category.icon_url ? (
                  <img src={category.icon_url} alt="" className={`w-6 h-6 rounded-md object-cover transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                ) : (
                  <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {category.icon}
                  </span>
                )}
                <span className="tracking-tight">{category.name}</span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-foreground shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
