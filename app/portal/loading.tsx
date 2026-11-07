import { Loader2 } from 'lucide-react';

export default function PortalLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
    </div>
  );
}
