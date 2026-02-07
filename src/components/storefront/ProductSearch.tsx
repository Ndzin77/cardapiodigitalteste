import { useState } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductSearch({ value, onChange, placeholder = "O que você procura?" }: ProductSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
      {/* Glow effect when focused */}
      {isFocused && (
        <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl -z-10 animate-pulse" />
      )}
      
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${isFocused ? "text-primary" : "text-muted-foreground"}`}>
          {isFocused ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`pl-12 pr-12 h-14 rounded-2xl text-base font-medium transition-all duration-300 shadow-soft ${
            isFocused 
              ? "bg-card border-primary/30 shadow-glow ring-2 ring-primary/10" 
              : "bg-secondary/70 border-transparent hover:bg-secondary"
          }`}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
