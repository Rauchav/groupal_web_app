import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-groupal-gold text-groupal-navy",
        orange:
          "border-transparent bg-groupal-orange text-white",
        green:
          "border-transparent bg-groupal-green text-white",
        navy:
          "border-transparent bg-groupal-navy text-white",
        outline:
          "border-groupal-gold text-groupal-gold bg-transparent",
        "outline-white":
          "border-white text-white bg-transparent",
        success:
          "border-transparent bg-green-100 text-green-800",
        danger:
          "border-transparent bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
