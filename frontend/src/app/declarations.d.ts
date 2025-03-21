/**
 * TypeScript declarations for external modules
 */

declare module 'react' {
  // React module declaration
}

declare module 'next/navigation' {
  // Next.js navigation module declaration
}

declare module 'next/image' {
  // Next.js Image component declaration
}

declare module 'lucide-react' {
  // Lucide React icons declaration
}

declare module 'sonner' {
  // Sonner toast library declaration
}

declare namespace JSX {
  interface IntrinsicElements {
    // Allow any JSX elements with proper attributes type
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
