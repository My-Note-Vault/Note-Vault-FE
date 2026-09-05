import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export function ContextMenuContent({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        collisionPadding={8}
        className={cn(
          "z-[70] min-w-44 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Item>) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return <ContextMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
