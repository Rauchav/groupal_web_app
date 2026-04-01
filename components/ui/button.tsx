import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-groupal-green text-white hover:bg-[#059c4f] active:scale-[0.98] focus-visible:ring-groupal-green",
        gold:
          "bg-groupal-gold text-groupal-navy hover:bg-[#f5c842] active:scale-[0.98] focus-visible:ring-groupal-gold font-bold",
        outline:
          "border-2 border-white text-white hover:bg-white hover:text-groupal-navy focus-visible:ring-white",
        "outline-navy":
          "border-2 border-groupal-navy text-groupal-navy hover:bg-groupal-navy hover:text-white focus-visible:ring-groupal-navy",
        ghost:
          "hover:bg-white/10 text-white focus-visible:ring-white",
        link:
          "text-groupal-gold underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "h-8 px-3 text-xs",
        default: "h-10 px-5 py-2",
        lg:   "h-12 px-8 text-base",
        xl:   "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
