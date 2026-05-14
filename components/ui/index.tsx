// Componentes de UI reutilizáveis — dark neon noir
import { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

// ---- Button ----
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "outline";
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
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";

  const variants = {
    primary:
      "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-900/40",
    danger:
      "bg-rose-700 hover:bg-rose-600 text-white focus:ring-rose-500 shadow-lg shadow-rose-900/40",
    ghost: "bg-transparent hover:bg-white/10 text-gray-300 hover:text-white",
    outline:
      "border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 bg-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ---- Input ----
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-400 tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-gray-900/80 border ${
          error ? "border-red-500" : "border-gray-700"
        } rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ---- Card ----
export function Card({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`bg-gray-900/70 border border-gray-800 rounded-xl backdrop-blur-sm ${
        glow ? "shadow-lg shadow-red-900/20 border-red-900/40" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ---- Badge ----
export function Badge({
  children,
  color = "gray",
}: {
  children: ReactNode;
  color?: "red" | "green" | "yellow" | "gray" | "blue" | "purple";
}) {
  const colors = {
    red: "bg-red-900/50 text-red-300 border-red-800",
    green: "bg-green-900/50 text-green-300 border-green-800",
    yellow: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
    gray: "bg-gray-800/50 text-gray-400 border-gray-700",
    blue: "bg-blue-900/50 text-blue-300 border-blue-800",
    purple: "bg-purple-900/50 text-purple-300 border-purple-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

// ---- Avatar ----
export function Avatar({
  emoji,
  size = "md",
  dead,
  disconnected,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  dead?: boolean;
  disconnected?: boolean;
}) {
  const sizes = { sm: "w-8 h-8 text-lg", md: "w-10 h-10 text-2xl", lg: "w-14 h-14 text-3xl", xl: "w-20 h-20 text-5xl" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center bg-gray-800 border-2 ${
        dead
          ? "border-red-900/50 opacity-40 grayscale"
          : disconnected
          ? "border-gray-700 opacity-60"
          : "border-gray-600"
      } select-none`}
    >
      {dead ? "💀" : emoji}
    </div>
  );
}

// ---- Fade In ----
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---- Timer Bar ----
export function TimerBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-2 rounded-full ${color} transition-colors duration-1000`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
}

// ---- Pulse Dot ----
export function PulseDot({ color = "green" }: { color?: "green" | "red" | "yellow" }) {
  const colors = { green: "bg-green-400", red: "bg-red-400", yellow: "bg-yellow-400" };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  );
}
