import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { useLocation } from "wouter";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  href: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

/** Internal view switch: no anchor, history write, hash or host theme routing. */
export function EmbedLink({ href, onClick, style, children, ...props }: Props) {
  const [, navigate] = useLocation();
  return (
    <button
      {...props}
      type="button"
      data-myu-view={href}
      style={{ textAlign: "inherit", ...style }}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.(event);
        navigate(href);
      }}
    >
      {children}
    </button>
  );
}
