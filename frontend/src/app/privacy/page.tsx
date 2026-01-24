import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | InvoyQ",
  description: "InvoyQ Privacy Policy - Learn how we protect your data",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-16 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-muted-foreground">
              Last Updated: January 23, 2026
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to InvoyQ ("we," "our," or "us"), a digital invoicing platform built and owned by <strong>Devchi Digital Ltd</strong>. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website (invoyq.com), mobile application (InvoyQ for iOS and Android), and related services (collectively, the "Service").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal & Business Information</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Account Data:</strong> Name, email, phone number, password, profile picture</li>
                <li><strong>Business Data:</strong> Company details, tax ID, client information, invoices, products, expenses</li>
                <li><strong>Payment Information:</strong> Billing details (processed via Stripe/Paystack)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Mobile App Data (InvoyQ for iOS & Android)</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Device Information:</strong> Device type, OS version, unique identifiers</li>
                <li><strong>App Usage:</strong> Features accessed, session duration, interactions</li>
                <li><strong>Camera & Storage:</strong> Access for uploading receipts and invoices (with permission)</li>
                <li><strong>Notifications:</strong> Push notification tokens for updates</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>IP address, browser type, operating system</li>
                <li>Usage patterns, pages visited, search queries</li>
                <li>Cookies and analytics data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our invoice management features</li>
                <li><strong>Account Management:</strong> To create and manage your account, authenticate users</li>
                <li><strong>Communication:</strong> To send transactional emails, notifications, and updates</li>
                <li><strong>Payment Processing:</strong> To process subscriptions and payments</li>
                <li><strong>Customer Support:</strong> To respond to inquiries and provide assistance</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve our Service</li>
                <li><strong>Security:</strong> To detect fraud, prevent abuse, and protect user data</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                <li><strong>Marketing:</strong> To send promotional content (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We protect your data using industry-standard security measures including encrypted databases, TLS/SSL encryption, secure password hashing, regular backups, and continuous monitoring. Both web and mobile app data is stored on secure cloud infrastructure with strict access controls.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>We do not sell your personal information.</strong> We may share data with:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Service Providers:</strong> Cloud hosting, payment processors (Stripe, Paystack), email services, analytics tools</li>
                <li><strong>Legal Requirements:</strong> When required by law, court orders, or to protect rights and prevent fraud</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, export, or delete your personal data. You can also manage communication preferences and opt-out of marketing emails. To exercise these rights, contact us at <strong>support@devchi.me</strong> and we will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication, preference cookies for settings, and analytics cookies to improve our Service. You can manage cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Provide our Service and maintain your account</li>
                <li>Comply with legal obligations (tax records, etc.)</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Prevent fraud and abuse</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                After account deletion, we may retain certain information in anonymized form for analytics and legal compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for children under 13 years of age (or 16 in certain jurisdictions). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">11. Third-Party Links and Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may contain links to third-party websites or integrate with third-party services. We are not responsible for their privacy practices. We encourage you to read their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">12. Regional Privacy Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>California (CCPA):</strong> Right to know, delete, and opt-out (we don't sell data).<br/>
                <strong>Europe (GDPR):</strong> Rights to access, rectification, erasure, data portability, and to lodge complaints with supervisory authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">14. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Posting the updated policy on our website</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for material changes</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions or concerns about this Privacy Policy, please contact:
              </p>
              <div className="mt-4 space-y-2 text-muted-foreground">
                <p><strong>Devchi Digital Ltd</strong></p>
                <p><strong>Email:</strong> support@devchi.me</p>
                <p><strong>Website:</strong> https://invoyq.com/privacy</p>
              </div>
            </section>

            <section className="mt-12 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Acknowledgment:</strong> By using InvoyQ, you acknowledge that you have read and understood this Privacy Policy and agree to its terms. We are committed to protecting your privacy and handling your data responsibly.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
