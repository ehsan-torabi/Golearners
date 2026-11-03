"use client";

import * as React from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * Shared error surface: a 404 / 500 state that names the cause and offers
 * the next action. Built on the farsiui Empty primitives so every route
 * (public site, dashboard, admin) shares one look.
 */
export function ErrorPage({
  code,
  title,
  body,
  actions,
  className,
}: {
  code: string;
  title: string;
  body: string;
  /** extra actions: e.g. a retry button for error boundaries */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("min-h-[60vh] border-line bg-card/60", className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-14 rounded-full bg-primary-tint text-accent-strong"
        >
          <span className="font-display text-2xl font-semibold">{code}</span>
        </EmptyMedia>
        <EmptyTitle className="font-display text-2xl font-semibold text-foreground">
          {title}
        </EmptyTitle>
        <EmptyDescription className="max-w-md text-sm leading-7 text-muted-foreground">
          {body}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-wrap items-center justify-center gap-3">
        {actions}
        <ButtonLink href="/" variant="outline">
          بازگشت به خانه
        </ButtonLink>
        <Link
          href="/courses"
          className="text-sm font-medium text-accent-strong transition-colors hover:text-primary-hover"
        >
          دوره‌ها
        </Link>
      </EmptyContent>
    </Empty>
  );
}

/** Retry button for the client error boundaries. */
export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button onClick={onRetry} variant="outline">
      تلاش دوباره
    </Button>
  );
}
