// Componentes de UI reutilizáveis — Neo Noir Criminal
import { ReactNode, ButtonHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "outline" | "blue";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  loading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-bold tracking-widest uppercase rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none";

  const variants = {
    primary:
      "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 glow-red",
    danger:
      "bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/40",
    ghost:
      "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/10",
    outline:
      "border border-white/10 hover:border-red-500/60 text-gray-300 hover:text-red-400 bg-transparent",
    blue:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 glow-blue",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-xs gap-2",
    lg: "px-7 py-3.5 text-sm gap-2.5",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as object)}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold tracking-widest uppercase text-gray-500">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-[#0B0F19] border ${
          error ? "border-red-500/70" : "border-white/10"
        } rounded-lg px-4 py-3 text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all ${className}`}
        {...props}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 flex items-center gap-1"
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "red" | "blue" | boolean;
}) {
  const glowClass =
    glow === "blue"
      ? "border-blue-500/30 shadow-lg shadow-blue-900/20"
      : glow
      ? "border-red-500/30 shadow-lg shadow-red-900/20"
      : "border-white/6";

  return (
    <div className={`glass rounded-xl border ${glowClass} ${className}`}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({
  children,
  color = "gray",
}: {
  children: ReactNode;
  color?: "red" | "green" | "yellow" | "gray" | "blue" | "purple";
}) {
  const colors = {
    red:    "bg-red-900/40 text-red-300 border-red-800/60",
    green:  "bg-green-900/40 text-green-300 border-green-800/60",
    yellow: "bg-yellow-900/40 text-yellow-300 border-yellow-800/60",
    gray:   "bg-white/5 text-gray-400 border-white/10",
    blue:   "bg-blue-900/40 text-blue-300 border-blue-800/60",
    purple: "bg-purple-900/40 text-purple-300 border-purple-800/60",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({
  emoji,
  size = "md",
  dead,
  glow,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  dead?: boolean;
  glow?: "red" | "blue";
}) {
  const sizes = { sm: "w-8 h-8 text-base", md: "w-11 h-11 text-2xl", lg: "w-14 h-14 text-3xl", xl: "w-20 h-20 text-4xl" };
  const glowClass =
    glow === "red" ? "ring-2 ring-red-500/60 shadow-lg shadow-red-900/40" :
    glow === "blue" ? "ring-2 ring-blue-500/60 shadow-lg shadow-blue-900/40" : "";

  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center bg-[#0B0F19] border border-white/10 ${glowClass} ${
        dead ? "grayscale opacity-40" : ""
      }`}
    >
      {emoji}
    </div>
  );
}

// ── FadeIn ────────────────────────────────────────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── TimerBar ──────────────────────────────────────────────────────────────────
export function TimerBar({ value, max, color = "red" }: { value: number; max: number; color?: "red" | "blue" | "yellow" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colors = {
    red:    "bg-red-500 shadow-red-500/40",
    blue:   "bg-blue-500 shadow-blue-500/40",
    yellow: "bg-yellow-500 shadow-yellow-500/40",
  };
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full shadow-lg ${colors[color]}`}
        initial={{ width: "100%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />
    </div>
  );
}

// ── PulseDot ──────────────────────────────────────────────────────────────────
export function PulseDot({ color = "green" }: { color?: "green" | "red" | "yellow" }) {
  const colors = {
    green:  "bg-green-400",
    red:    "bg-red-400",
    yellow: "bg-yellow-400",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  );
}
