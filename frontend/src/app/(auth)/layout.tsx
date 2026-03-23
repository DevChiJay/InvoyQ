import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-teal-950 dark:to-gray-900">
      {/* Header Navigation */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="InvoYQ"
              width={120}
              height={32}
              className="h-8 w-auto dark:brightness-0 dark:invert"
              style={{ height: "auto" }}
              priority
            />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </div>
  );
}
