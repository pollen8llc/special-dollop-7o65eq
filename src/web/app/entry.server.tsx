import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/node';
import isbot from 'isbot';
import root from './root';

/**
 * Main request handler for server-side rendering with performance optimization
 * and comprehensive security measures.
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
): Promise<Response> {
  const userAgent = request.headers.get('user-agent');
  const isBot = isbot(userAgent || '');

  // Set strict security headers
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-XSS-Protection', '1; mode=block');
  responseHeaders.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.clerk.dev https://api.linkedin.com;"
  );
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Set performance-related headers
  responseHeaders.set('Cache-Control', 'public, max-age=60, s-maxage=60');
  responseHeaders.set('Vary', 'Accept-Encoding');

  // Handle bot requests with complete SSR for optimal SEO
  if (isBot) {
    return handleBotRequest(request, responseStatusCode, responseHeaders, remixContext);
  }

  // Handle regular document requests with streaming SSR
  return handleDocumentRequest(request, responseStatusCode, responseHeaders, remixContext);
}

/**
 * Specialized handler for bot requests with complete SSR for optimal SEO
 */
async function handleBotRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  remixContext: EntryContext
): Promise<Response> {
  try {
    // Render the entire page synchronously for bots
    const markup = renderToString(
      <RemixServer context={remixContext} url={request.url} />
    );

    headers.set('Content-Type', 'text/html; charset=utf-8');

    return new Response('<!DOCTYPE html>' + markup, {
      status: statusCode,
      headers,
    });
  } catch (error) {
    console.error('Bot rendering error:', error);
    return new Response('Error rendering page', { status: 500 });
  }
}

/**
 * Handles regular document requests with streaming SSR and progressive hydration
 */
function handleDocumentRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  remixContext: EntryContext
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let didError = false;
    const abortController = new AbortController();

    // Set up streaming response with progressive hydration
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          headers.set('Content-Type', 'text/html; charset=utf-8');

          resolve(
            new Response(pipe(abortController.signal), {
              status: didError ? 500 : statusCode,
              headers,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error('Streaming rendering error:', error);
        },
        bootstrapScriptContent: `window.ENV = ${JSON.stringify({
          NODE_ENV: process.env.NODE_ENV,
          CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
        })}`,
        bootstrapModules: ['/entry.client.js'],
        progressiveChunks: true,
      }
    );

    // Handle request timeouts
    setTimeout(() => {
      abort();
      resolve(
        new Response('Request timeout', {
          status: 504,
          headers: { 'Content-Type': 'text/plain' },
        })
      );
    }, 10000);

    // Handle client disconnection
    request.signal.addEventListener('abort', () => {
      abort();
    });
  });
}