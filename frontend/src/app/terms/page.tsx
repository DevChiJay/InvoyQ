import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "InvoYQ Terms of Service — Read our terms and conditions for using the InvoYQ invoicing platform.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-teal-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-linear-to-br from-[#6366F1] to-[#14B8A6] rounded-2xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Last updated: November 2, 2025
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  By accessing and using InvoYQ ("the Service"), you agree to be
                  bound by these Terms of Service ("Terms"). If you do not agree
                  to these Terms, please do not use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  InvoYQ is an AI-powered invoice extraction and management
                  platform that helps businesses:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>
                    Extract data from invoice documents using AI technology
                  </li>
                  <li>Manage client information and relationships</li>
                  <li>Generate and organize invoices</li>
                  <li>Process payments through integrated payment providers</li>
                  <li>Send automated payment reminders</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  3. User Accounts and Registration
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  To use certain features of our Service, you must create an
                  account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>
                    Provide accurate and complete information during
                    registration
                  </li>
                  <li>Maintain the security of your account credentials</li>
                  <li>
                    Notify us immediately of any unauthorized use of your
                    account
                  </li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  4. Subscription Plans and Billing
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    InvoYQ offers both free and paid subscription plans:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Free Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Limited to 10 AI extractions per month with basic
                      features.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Pro Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      $19 USD or ₦20,000 NGN per month with unlimited
                      extractions and advanced features.
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Subscriptions are billed monthly and automatically renew
                    unless cancelled. You may cancel your subscription at any
                    time through your account settings.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  5. Data Privacy and Security
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We take your privacy seriously. Your uploaded documents and
                  extracted data are processed securely and stored in accordance
                  with our Privacy Policy. We do not share your business data
                  with third parties except as necessary to provide our services
                  or as required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  6. Acceptable Use Policy
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>Upload malicious files or content that violates laws</li>
                  <li>Attempt to reverse engineer or hack our systems</li>
                  <li>Use the service for fraudulent activities</li>
                  <li>Share your account with unauthorized users</li>
                  <li>Overload our systems with excessive requests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  InvoYQ is provided "as is" without warranties of any kind. We
                  shall not be liable for any indirect, incidental, special, or
                  consequential damages arising from your use of the Service.
                  Our total liability shall not exceed the amount you paid for
                  the Service in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  8. Termination
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We may terminate or suspend your account at our discretion if
                  you violate these Terms. Upon termination, your access to the
                  Service will cease, but these Terms will remain in effect
                  regarding your past use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  9. Changes to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We
                  will notify users of significant changes via email or through
                  the Service. Your continued use of the Service after changes
                  constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  10. Contact Information
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  If you have questions about these Terms of Service, please
                  contact us at support@devchi.me.
                </p>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  InvoYQ is created by{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Devchi Digital
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
