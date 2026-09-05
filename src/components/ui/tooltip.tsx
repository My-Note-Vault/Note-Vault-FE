import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={600} skipDelayDuration={200}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  children,
  content,
  side = "right",
}: {
  children: ReactNode;
  content: ReactNode;
  side?: ComponentProps<typeof TooltipPrimitive.Content>["side"];
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[80] rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md border border-border animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-popover" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
