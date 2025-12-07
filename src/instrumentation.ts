import * as Sentry from "@sentry/nextjs";
import { requireValidEnvironment } from "./lib/env";

export async function register() {
    // Validate environment variables at startup (only in Node.js runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        try {
            requireValidEnvironment();
        } catch (error) {
            console.error('Failed to start application:', error);
            process.exit(1);
        }
    }

    if (process.env.NEXT_RUNTIME === "nodejs") {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: 1.0,
            debug: false,
        });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: 1.0,
            debug: false,
        });
    }
}

// Export the required hook for server-side error tracking
export const onRequestError = Sentry.captureRequestError;
