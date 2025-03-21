import Image from 'next/image';

// Remove unused import
// import { DialogTrigger } from '@/components/ui/dialog';

// Fix missing alt attributes (lines 376, 502, 731)
<Image 
  src="..." 
  alt="Description of the image" 
  // ... other props
/>

// Replace img with Next.js Image (lines 629, 785)
// Replace:
// <img src="..." />
// With:
<Image 
  src="..." 
  alt="Description" 
  width={500} 
  height={300} 
  // Use appropriate dimensions
/>

// Fix any type (line 767)
// Replace 'any' with a more specific type
// ... existing code ... 