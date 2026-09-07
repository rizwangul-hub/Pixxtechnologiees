import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, FileText, ChevronDown, ExternalLink } from 'lucide-react';
import logoImg from '../assets/image/logo.png';

export function PrivacyNoticePage() {
  useEffect(() => {
    document.title = 'Privacy Notice | LandlordVision';
    window.scrollTo(0, 0);
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sections = [
    { id: 'sec-intro', title: '1. Introduction' },
    { id: 'sec-data-collect', title: '2. Data We Collect & Grounds' },
    { id: 'sec-open-banking', title: '3. Open Banking & AIS Services' },
    { id: 'sec-sensitive-data', title: '4. Sensitive Data' },
    { id: 'sec-marketing-comms', title: '5. Marketing Communications' },
    { id: 'sec-ad-audiences', title: '6. Advertising Audiences & Matching' },
    { id: 'sec-disclosures', title: '7. Disclosures of Personal Data' },
    { id: 'sec-intl-transfers', title: '8. International Transfers' },
    { id: 'sec-data-security', title: '9. Data Security' },
    { id: 'sec-data-retention', title: '10. Data Retention' },
    { id: 'sec-legal-rights', title: '11. Your Legal Rights' },
    { id: 'sec-automated-decisions', title: '12. Automated Decision-Making' },
    { id: 'sec-dp-contact', title: '13. Data Protection Contact' },
    { id: 'sec-third-party-links', title: '14. Third-Party Links' },
    { id: 'sec-cookies', title: '15. Cookies' },
    { id: 'sec-governing-law', title: '16. Governing Law & Jurisdiction' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 antialiased flex flex-col">
      {/* PAGE HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/register" className="inline-block transition-transform hover:scale-105">
            <img
              src={logoImg}
              alt="LandlordVision"
              className="h-[87px] sm:h-[91px] w-auto object-contain max-w-[380px] box-content"
              style={{ boxSizing: 'content-box' }}
            />
          </Link>

          {/* Action Button: Back to Register */}
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all text-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
            <span>Back to Register</span>
          </Link>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="bg-white border-b border-gray-200 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#04A26F] text-xs font-semibold border border-emerald-200 mb-3">
              <Shield className="w-3.5 h-3.5" />
              Official Legal & Privacy Notice
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Privacy Notice
            </h1>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Last updated: <span className="text-gray-800 font-semibold">July 28, 2026</span>
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        
        {/* MOBILE SIDEBAR DROPDOWN */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 shadow-xs"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#04A26F]" />
              <span>Jump to Section ({sections.length})</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileNavOpen && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md max-h-72 overflow-y-auto space-y-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:text-[#04A26F] hover:bg-emerald-50"
                >
                  {sec.title}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* DESKTOP SIDEBAR: TABLE OF CONTENTS */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                On this page
              </h3>
              <nav className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:text-[#04A26F] hover:bg-emerald-50/60 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* PRIVACY CONTENT */}
          <article className="lg:col-span-9 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-xs space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1. Introduction to the Landlord Vision privacy notice */}
            <section id="sec-intro" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">1.</span> Introduction to the Landlord Vision privacy notice
              </h2>
              <p>
                This privacy notice provides you with details of how we collect and process your personal data through your use of our site <a href="https://www.landlordvision.co.uk/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.landlordvision.co.uk</a>.
              </p>
              <p>
                By providing us with your data, you warrant to us that you are aged 18 or over. This notice and our services are directed at adults with legal capacity to contract. Where our services are used by, or on behalf of, an organisation, that organisation warrants that any individual about whom personal data is provided to us is aged 18 or over.
              </p>
              <p>
                <strong>Landlord Vision Ltd</strong> is the data controller and we are responsible for your personal data (referred to as ‘we’, ‘us’ or ‘our’ in this privacy notice).
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-gray-800">
                <h3 className="font-bold text-gray-900">Our full details are:</h3>
                <p><strong>Full name of legal entity:</strong> Landlord Vision Ltd</p>
                <p><strong>Email address:</strong> <a href="mailto:info@landlordvision.co.uk" className="text-[#04A26F] font-semibold hover:underline">info@landlordvision.co.uk</a></p>
                <p><strong>Postal address:</strong> 3 Sanderson Close, Great Sankey, Warrington, Cheshire, WA5 3LN</p>
              </div>
              <p className="text-xs text-gray-500">
                It is very important that the information we hold about you is accurate and up to date. Please let us know if at any time your personal information changes by emailing us at <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a>.
              </p>
            </section>

            {/* 2. What data do we collect about you, for what purpose and on what ground we process it */}
            <section id="sec-data-collect" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">2.</span> What data do we collect about you, for what purpose and on what ground we process it
              </h2>
              <p>We may process the following categories of personal data about you:</p>

              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <h3 className="font-bold text-gray-900 text-sm">Communication Data</h3>
                  <p>Includes any communication that you send to us whether that be through the contact form on our website, through email, text, social media messaging, social media posting or any other communication that you send us. We process this data for the purposes of communicating with you, for record keeping and for the establishment, pursuance or defence of legal claims.</p>
                  <p className="text-[#04A26F] font-semibold pt-1">Lawful ground: Legitimate interests to reply to communications, keep records, and defend legal claims.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <h3 className="font-bold text-gray-900 text-sm">Customer Data</h3>
                  <p>Includes data relating to any purchases of goods and/or services such as your name, title, billing address, delivery address, email address, phone number, contact details, purchase details and your card details. We process this data to supply the goods and/or services you have purchased and to keep records of such transactions.</p>
                  <p className="text-[#04A26F] font-semibold pt-1">Lawful ground: Performance of a contract between you and us.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <h3 className="font-bold text-gray-900 text-sm">User Data</h3>
                  <p>Includes data about how you use our website and any online services together with any data that you post for publication on our website or through other online services. We process this data to operate our website and ensure relevant content is provided to you, to ensure the security of our website, to maintain back-ups of our website and/or databases and to enable publication and administration of our website.</p>
                  <p className="text-[#04A26F] font-semibold pt-1">Lawful ground: Legitimate interests to properly administer our website and business.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <h3 className="font-bold text-gray-900 text-sm">Technical Data</h3>
                  <p>Includes data about your use of our website and online services such as your IP address, login data, browser details, length of visit to pages, page views and navigation paths, details about the number of times you use our website, time zone settings and other technology on the devices you use. The source of this data is from our analytics tracking system.</p>
                  <p className="text-[#04A26F] font-semibold pt-1">Lawful ground: Legitimate interests to analyze website use, protect business, deliver content, and grow business.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 text-xs">
                  <h3 className="font-bold text-gray-900 text-sm">Marketing Data</h3>
                  <p>Includes data about your preferences in receiving marketing from us and our third parties and your communication preferences. We process this data to enable you to partake in our promotions such as competitions, prize draws and free giveaways, and to deliver relevant content.</p>
                  <p className="text-[#04A26F] font-semibold pt-1">Lawful ground: Legitimate interests to study how customers use products and grow our business.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                We may use Customer Data, User Data, Technical Data and Marketing Data to deliver relevant website content and advertisements to you (including Facebook adverts or other display advertisements) and to measure or understand the effectiveness of the advertising we serve you. Our lawful ground under UK GDPR for this processing is legitimate interests (namely to grow our business); where we send electronic marketing communications, we rely on your consent or, where applicable, the ‘soft opt-in’ exemption under the Privacy and Electronic Communications Regulations 2003 (PECR).
              </p>
            </section>

            {/* 3. Open Banking and Account Information Services */}
            <section id="sec-open-banking" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">3.</span> Open Banking and Account Information Services
              </h2>
              <p>
                Where you choose to connect a bank or payment account to our software in order to use account information services (for example, to view transaction data or account balances within Landlord Vision), Landlord Vision Ltd acts as an FCA-authorised Account Information Service Provider (AISP) under registration number 918962, regulated under the Payment Services Regulations 2017.
              </p>
              <p>
                We will only access, retrieve and use your account data with your explicit, informed consent, given through the Open Banking consent flow provided by your bank or payment account provider. We will only use this data for the purposes to which you have consented (such as displaying your account information within our software) and will not use it for unsolicited marketing purposes.
              </p>
              <p className="text-xs text-gray-600 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                You may withdraw your consent at any time, either through your bank or payment account provider’s own systems or by contacting us at <a href="mailto:info@landlordvision.co.uk" className="text-[#04A26F] font-semibold hover:underline">info@landlordvision.co.uk</a> or <a href="mailto:privacy@landlordvision.co.uk" className="text-[#04A26F] font-semibold hover:underline">privacy@landlordvision.co.uk</a>. Withdrawing consent will not affect the lawfulness of any processing carried out before you withdrew it.
              </p>
            </section>

            {/* 4. Sensitive Data */}
            <section id="sec-sensitive-data" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">4.</span> Sensitive Data
              </h2>
              <p>
                We do not collect any Sensitive Data about you. Sensitive data refers to data that includes details about your race or ethnicity, religious or philosophical beliefs, sex life, sexual orientation, political opinions, trade union membership, information about your health and genetic and biometric data. We do not collect any information about criminal convictions and offences.
              </p>
              <p>
                Where we are required to collect personal data by law, or under the terms of the contract between us and you do not provide us with that data when requested, we may not be able to perform the contract (for example, to deliver goods or services to you). If you don’t provide us with the requested data, we may have to cancel a product or service you have ordered but if we do, we will notify you at the time.
              </p>
              <p>
                We will only use your personal data for a purpose it was collected for or a reasonably compatible purpose if necessary. For more information on this please email us at <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a>. In case we need to use your details for an unrelated new purpose we will let you know and explain the legal grounds for processing.
              </p>
            </section>

            {/* 5. Marketing communications */}
            <section id="sec-marketing-comms" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">5.</span> Marketing communications
              </h2>
              <p>
                Our lawful ground under UK GDPR for processing your personal data to send you marketing communications is our legitimate interests (namely to grow our business). Separately, the Privacy and Electronic Communications Regulations 2003 (PECR) govern how we may contact you by electronic means (such as email or SMS) for marketing purposes.
              </p>
              <p>
                Under PECR, we may send you marketing communications if (i) you made a purchase or asked for information from us about our goods or services or (ii) you agreed to receive marketing communications, and, in each case, you have not opted out since. If you are a limited company, we may send you marketing emails without prior consent, but you can still opt out at any time.
              </p>
              <p>
                Before we share your personal data with any third party for their own marketing purposes we will get your express consent.
              </p>
              <p className="text-xs text-gray-600">
                You can ask us or third parties to stop sending you marketing messages at any time by logging into the website and adjusting your preference boxes, following the opt-out links on any marketing message, or by emailing us at <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a>.
              </p>
            </section>

            {/* 6. Advertising audiences & matching */}
            <section id="sec-ad-audiences" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">6.</span> Advertising audiences & matching
              </h2>
              <p>
                Where permitted, we may use your contact identifiers (e.g., email address and/or phone number) to create customer audience lists with advertising partners such as Google Ads (Customer Match), Microsoft Advertising and Meta (Custom Audiences). Before upload, identifiers are hashed and used by these partners solely to find matching users and to show or suppress Landlord Vision adverts; they are not permitted to use our lists to build or append profiles for their own marketing.
              </p>
              <p>
                <strong>Lawful basis:</strong> For electronic marketing, we rely on your consent or the ‘soft opt-in’ exemption under PECR. Under UK GDPR, our lawful basis is legitimate interests to promote our services, balanced against your rights and interests.
              </p>
              <p className="text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong>Your choices:</strong> You can opt out of our list-based advertising at any time by emailing <a href="mailto:privacy@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">privacy@landlordvision.co.uk</a>; we will remove your details from future audience uploads.
              </p>
            </section>

            {/* 7. Disclosures of your personal data */}
            <section id="sec-disclosures" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">7.</span> Disclosures of your personal data
              </h2>
              <p>We may have to share your personal data with the parties set out below:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                <li><strong>Advertising technology providers:</strong> Google Ireland Ltd (Google Ads, Analytics), Microsoft Ireland Operations Ltd / Microsoft Corporation (Microsoft Advertising, Clarity), Meta Platforms Ireland Ltd (Facebook/Instagram).</li>
                <li><strong>Service providers:</strong> IT and system administration service providers.</li>
                <li><strong>Professional advisers:</strong> Lawyers, bankers, auditors, and insurers.</li>
                <li><strong>Government bodies:</strong> Tax, regulatory, or legal authorities requiring processing reports.</li>
                <li><strong>Business transfers:</strong> Third parties to whom we sell, transfer, or merge parts of our business or assets.</li>
                <li><strong>Commercial partners:</strong> Named partners involving joint provision of services. Details available on request via <a href="mailto:info@landlordvision.co.uk" className="text-[#04A26F] font-semibold hover:underline">info@landlordvision.co.uk</a>.</li>
                <li><strong>Third party analytics apps:</strong> In-software behavior analysis providers.</li>
                <li><strong>Operational support processor:</strong> An operational support provider located outside the UK, engaged strictly under an Article 28 UK GDPR data processing agreement for tasks such as data entry, document processing, and onboarding support.</li>
              </ul>
              <p className="text-xs text-gray-600">
                We use an external company, Trustpilot A/S (“Trustpilot”), to collect feedback. If invited to review, your name, email address, and reference number will be shared with Trustpilot for this purpose. You can view <a href="https://legal.trustpilot.com/end-user-privacy-terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline inline-flex items-center gap-0.5">Trustpilot's Privacy Policy here <ExternalLink className="w-3 h-3" /></a>.
              </p>
            </section>

            {/* 8. International transfers */}
            <section id="sec-intl-transfers" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">8.</span> International transfers
              </h2>
              <p>
                A limited number of our service providers and advertising partners may process your personal data outside the UK and the European Economic Area (EEA), including in the United States. Where we make such a transfer, we ensure an appropriate level of protection is in place using recognised transfer mechanisms: (i) UK Government adequacy decisions; (ii) UK-recognised contractual safeguards, such as the International Data Transfer Agreement (IDTA) or UK Addendum to standard clauses; or (iii) recognised transfer safeguards under UK Data Protection Law.
              </p>
              <p>
                In addition, Landlord Vision may engage an operational support and data-processing provider located outside the UK for onboarding and document processing under a written Article 28 data processing agreement. Any such transfer constitutes a ‘Restricted Transfer’ under UK Data Protection Law with appropriate IDTA safeguards.
              </p>
            </section>

            {/* 9. Data security */}
            <section id="sec-data-security" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">9.</span> Data security
              </h2>
              <p>
                We have put in place security measures to prevent your personal data from being accidentally lost, used, altered, disclosed, or accessed without authorisation. We also allow access to your personal data only to those employees and partners who have a business need to know such data. They will only process your personal data on our instructions and they must keep it confidential.
              </p>
              <p>
                We have procedures in place to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach if we are legally required to.
              </p>
            </section>

            {/* 10. Data retention */}
            <section id="sec-data-retention" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">10.</span> Data retention
              </h2>
              <p>
                We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <p><strong>Tax & Legal Obligation:</strong> Tax law requires keeping basic customer data (Contact, Identity, Financial, Transaction Data) for 6 years after relationships end.</p>
                <p><strong>Communication Data:</strong> Retained for up to 2 years from last communication.</p>
                <p><strong>User Data:</strong> Retained for account duration and up to 2 years after closure.</p>
                <p><strong>Technical Data:</strong> Retained for up to 26 months from collection.</p>
                <p><strong>Marketing Data:</strong> Retained until consent is withdrawn or up to 3 years from last engagement.</p>
              </div>
            </section>

            {/* 11. Your legal rights */}
            <section id="sec-legal-rights" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">11.</span> Your legal rights
              </h2>
              <p>
                Under data protection laws you have rights in relation to your personal data that include the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where lawful ground is consent) to withdraw consent.
              </p>
              <p className="text-xs">
                You can see more details about these rights at the Information Commissioner's Office (ICO):{' '}
                <a href="https://ico.org.uk/for-organisations/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline inline-flex items-center gap-0.5">
                  ICO Individual Rights Guide <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-xs text-gray-600">
                To exercise your rights, contact us at <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a> or <a href="mailto:privacy@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">privacy@landlordvision.co.uk</a>. We respond to legitimate requests within one month. You also have the right to complain to the Information Commissioner’s Office (<a href="https://ico.org.uk/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.ico.org.uk</a>).
              </p>
            </section>

            {/* 12. Automated decision-making and profiling */}
            <section id="sec-automated-decisions" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">12.</span> Automated decision-making and profiling
              </h2>
              <p>
                We may use User Data, Technical Data and Marketing Data to carry out profiling for the purposes of understanding your preferences, personalising content, and assessing marketing. This profiling does not result in decisions that produce legal effects concerning you or that similarly significantly affect you.
              </p>
            </section>

            {/* 13. Data protection contact */}
            <section id="sec-dp-contact" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">13.</span> Data protection contact
              </h2>
              <p>
                We have designated <a href="mailto:privacy@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">privacy@landlordvision.co.uk</a> as our dedicated contact point for any questions, concerns or requests relating to data protection or this privacy notice.
              </p>
            </section>

            {/* 14. Third-party links */}
            <section id="sec-third-party-links" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">14.</span> Third-party links
              </h2>
              <p>
                This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            {/* 15. Cookies */}
            <section id="sec-cookies" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">15.</span> Cookies
              </h2>
              <p>
                We only set advertising/personalisation cookies and activate related tags (e.g., Google Consent Mode, Microsoft Advertising UET, Microsoft Clarity, Meta Pixel) after you consent in our cookie banner. You can change your preferences at any time via the banner link in our footer.
              </p>
              <p className="text-xs text-gray-600">
                For more information about the cookies we use, please see our <a href="https://www.landlordvision.co.uk/index/cookie-policy-popup/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">Cookie Policy</a>.
              </p>
            </section>

            {/* 16. Governing law and jurisdiction */}
            <section id="sec-governing-law" className="scroll-mt-24 space-y-4 pt-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">16.</span> Governing law and jurisdiction
              </h2>
              <p>
                This privacy notice is governed by, and shall be construed in accordance with, the laws of England and Wales. You consent to the exclusive jurisdiction of the courts of England and Wales to settle any disputes arising out of or in connection with this privacy notice, consistent with the governing law and jurisdiction provisions of the End User Licence Agreement and the{' '}
                <Link to="/terms-and-conditions" className="font-semibold text-[#04A26F] hover:underline">
                  Website Terms and Conditions
                </Link>
                .
              </p>

              <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-6 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Privacy questions or concerns?</h3>
                  <p className="text-xs text-gray-600">Contact our data protection team at Landlord Vision Ltd.</p>
                  <p className="text-xs text-gray-500 mt-1">3 Sanderson Close, Great Sankey, Warrington, Cheshire, WA5 3LN</p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href="mailto:privacy@landlordvision.co.uk" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs text-xs font-semibold text-gray-800 hover:border-[#04A26F]">
                    <Mail className="w-4 h-4 text-[#04A26F]" />
                    <span>Email: <strong className="text-[#04A26F]">privacy@landlordvision.co.uk</strong></span>
                  </a>
                  <a href="mailto:info@landlordvision.co.uk" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs text-xs font-semibold text-gray-800 hover:border-[#04A26F]">
                    <Mail className="w-4 h-4 text-[#04A26F]" />
                    <span>General: <strong className="text-[#04A26F]">info@landlordvision.co.uk</strong></span>
                  </a>
                </div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* PAGE FOOTER WITH BOTTOM BACK TO REGISTER LINK */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Landlord Vision Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/register" className="text-[#04A26F] font-semibold hover:underline">
              Back to Register
            </Link>
            <span>&bull;</span>
            <Link to="/terms-and-conditions" className="text-gray-600 hover:underline">
              Terms and Conditions
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="text-gray-600 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
