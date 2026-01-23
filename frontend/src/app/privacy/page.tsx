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
                Welcome to InvoyQ ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our invoice management application and services (collectively, the "Service").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Account Information: Name, email address, phone number, and password</li>
                <li>Profile Information: Avatar/profile picture, business name, company logo</li>
                <li>Business Information: Company name, address, tax ID, website</li>
                <li>Payment Information: Billing address, payment method details (processed securely through third-party payment providers)</li>
                <li>Communication Data: Messages, feedback, and support requests</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Business Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                When using our Service, you may provide:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Client Information: Names, email addresses, phone numbers, addresses</li>
                <li>Invoice Data: Invoice details, line items, amounts, dates</li>
                <li>Product/Service Information: Descriptions, prices, quantities</li>
                <li>Expense Records: Categories, amounts, receipts, descriptions</li>
                <li>Transaction History: Payment records and transaction details</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Device Information: IP address, browser type, operating system, device identifiers</li>
                <li>Usage Data: Pages visited, features used, time spent, search queries</li>
                <li>Location Data: General geographic location based on IP address</li>
                <li>Cookies and Similar Technologies: Session IDs, preferences, analytics data</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Information from Third Parties</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may receive information from third-party services you choose to connect:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>OAuth Providers: Google, Microsoft (name, email, profile picture)</li>
                <li>Payment Processors: Stripe, Paystack (transaction confirmations)</li>
                <li>Analytics Services: Usage patterns and demographics</li>
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
              
              <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Data Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored securely using industry-standard practices:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Encrypted databases with access controls</li>
                <li>Secure cloud storage for files and attachments</li>
                <li>Regular backups to prevent data loss</li>
                <li>Data centers in secure, compliant facilities</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Security Measures</h3>
              <p className="text-muted-foreground leading-relaxed">
                We implement comprehensive security measures:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>TLS/SSL encryption for data transmission</li>
                <li>Password hashing using industry-standard algorithms</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection practices</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Monitoring for suspicious activity and security threats</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your data in the following circumstances:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Service Providers</h3>
              <p className="text-muted-foreground leading-relaxed">
                We share data with trusted third-party service providers who assist us:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Cloud hosting and infrastructure providers</li>
                <li>Payment processors (Stripe, Paystack)</li>
                <li>Email service providers</li>
                <li>Analytics and monitoring tools</li>
                <li>Customer support platforms</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Legal Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose information if required by law or to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Comply with legal obligations and court orders</li>
                <li>Protect our rights, property, and safety</li>
                <li>Prevent fraud or security issues</li>
                <li>Respond to government requests</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Business Transfers</h3>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Access and Portability</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Request access to your personal information</li>
                <li>Receive a copy of your data in a portable format</li>
                <li>Export your invoices, clients, and business data</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Correction and Deletion</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Update or correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Communication Preferences</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Unsubscribe from marketing emails</li>
                <li>Manage notification settings</li>
                <li>Opt-out of certain data collection</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Exercising Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed">
                To exercise any of these rights, please contact us at privacy@invoyq.com. We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Types of Cookies</h3>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service</li>
                <li><strong>Marketing Cookies:</strong> Used for advertising (with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Managing Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings. Note that disabling certain cookies may affect Service functionality.
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
              <h2 className="text-2xl font-semibold mt-8 mb-4">12. California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground leading-relaxed">
                California residents have specific rights under the California Consumer Privacy Act:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">13. European Privacy Rights (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are in the European Economic Area (EEA), you have additional rights under GDPR:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                <li>Right to access, rectification, and erasure</li>
                <li>Right to restrict or object to processing</li>
                <li>Right to data portability</li>
                <li>Right to withdraw consent</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
              </ul>
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
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> privacy@invoyq.com</p>
                <p><strong>Support:</strong> support@invoyq.com</p>
                <p><strong>Website:</strong> https://invoyq.com/privacy</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">16. Data Protection Officer</h2>
              <p className="text-muted-foreground leading-relaxed">
                For users in the EEA, you may contact our Data Protection Officer at:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>Email:</strong> dpo@invoyq.com
              </p>
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
