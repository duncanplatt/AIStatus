"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { createPopper, type Instance as PopperInstance } from "@popperjs/core";
import { useIsClient } from "./use-is-client";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  placement = "bottom",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const isClient = useIsClient();
  const referenceRef = useRef<HTMLSpanElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<PopperInstance | null>(null);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!isClient) return;
    const ref = referenceRef.current;
    const popper = popperRef.current;
    if (!ref || !popper) return;

    instanceRef.current = createPopper(ref, popper, {
      placement,
      modifiers: [
        { name: "offset", options: { offset: [0, 6] } },
        { name: "preventOverflow", options: { padding: 8 } },
      ],
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [placement, isClient]);

  useEffect(() => {
    if (visible) {
      instanceRef.current?.update();
    }
  }, [visible]);

  const tooltipLayer = (
    <div
      ref={popperRef}
      role="tooltip"
      className={`z-9999 max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg transition-opacity duration-150 ${
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {content}
      <div data-popper-arrow="" />
    </div>
  );

  return (
    <>
      <span
        ref={referenceRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex items-center"
      >
        {children}
      </span>
      {isClient ? createPortal(tooltipLayer, document.body) : null}
    </>
  );
}
