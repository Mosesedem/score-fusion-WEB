import { notFound } from 'next/navigation';
import Link from 'next/link';

// Optional: You can throw notFound() here if you want to auto-trigger, but typically
// it's thrown in other pages/layouts. This file just renders the UI.

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-lg shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold  mb-4">404 - Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}