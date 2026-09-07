import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, FileText, ChevronDown, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/image/logo.png';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Terms and Conditions | LandlordVision';
    window.scrollTo(0, 0);
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sections = [
    { id: 'sec-intro', title: '1. Introduction' },
    { id: 'sec-software', title: '2. Software Restrictions' },
    { id: 'sec-copyright', title: '3. Copyright' },
    { id: 'sec-privacy', title: '4. Privacy Notice' },
    { id: 'sec-who-owns-data', title: '5. Who owns my Data?' },
    { id: 'sec-rental-agreement', title: '6. Rental Agreement' },
    { id: 'sec-billing', title: '7. Billing' },
    { id: 'sec-renewing', title: '8. Renewing Subscription' },
    { id: 'sec-general-plan', title: '9. General Plan Terms' },
    { id: 'sec-discount-codes', title: '10. Discount Codes' },
    { id: 'sec-support', title: '11. Support' },
    { id: 'sec-cancellations', title: '12. Account Cancellations' },
    { id: 'sec-backups', title: '13. Back-ups' },
    { id: 'sec-warranty', title: '14. Warranty' },
    { id: 'sec-indemnity', title: '15. Indemnity' },
    { id: 'sec-fca-incidents', title: '16. FCA Incident Reporting' },
    { id: 'sec-regulatory', title: '17. Regulatory Status & Complaints' },
    { id: 'sec-disclaimer', title: '18. Disclaimer' },
    { id: 'sec-liability', title: '19. Limitation of Liability' },
    { id: 'sec-digital-content', title: '20. Digital Content' },
    { id: 'sec-legal-docs', title: '21. Legal Documents' },
    { id: 'sec-tax-reports', title: '22. Tax Reports' },
    { id: 'sec-applicable-law', title: '23. Applicable Law' },
    { id: 'sec-assignment', title: '24. Assignment' },
    { id: 'sec-waiver', title: '25. Waiver' },
    { id: 'sec-third-party-content', title: '26. Third Party Content' },
    { id: 'sec-advertisements', title: '27. Advertisements' },
    { id: 'sec-severability', title: '28. Severability' },
    { id: 'sec-notices', title: '29. Notices' },
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

          {/* Top Action Button: Back to Register */}
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
              <FileText className="w-3.5 h-3.5" />
              Official Terms & Conditions
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Terms and Conditions
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

          {/* TERMS CONTENT */}
          <article className="lg:col-span-9 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-xs space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1. Introduction to the Landlord Vision terms and conditions */}
            <section id="sec-intro" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">1.</span> Introduction to the Landlord Vision terms and conditions
              </h2>
              <p>
                Welcome to the <a href="https://www.landlordvision.co.uk" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.landlordvision.co.uk</a> (“the Website”) Terms and Conditions. By accessing or using the Website you agree to these terms and conditions and you agree to use the Website in accordance with all applicable laws. If you do not agree to these terms and conditions please do not continue to use the Website. We'll keep these terms and conditions up to date at <a href="https://www.landlordvision.co.uk" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.landlordvision.co.uk</a>.
              </p>
              <p>
                Please review these Terms and Conditions regularly as we may at any time change these terms and conditions and all changes will be effective immediately and you will be deemed to have accepted any changes from the moment they are made. We hope that you enjoy using our Website and if you have any questions relating to these Terms and Conditions or the Website itself then please contact us at <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a>.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 space-y-1">
                <p>
                  Please note that when we say "we", "us" and "our" in these terms and conditions we mean <strong>Landlord Vision Limited (“Landlord Vision”)</strong>, a company registered in the United Kingdom under company registration number 8657841 with a registered address at 3 Sanderson Close, Great Sankey, Warrington, Cheshire, United Kingdom.
                </p>
                <p className="flex items-center gap-1.5 text-emerald-800 pt-1 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#04A26F] shrink-0" />
                  <span>Landlord Vision is authorised and regulated by the Financial Conduct Authority (FCA) as a registered Account Information Service Provider under FCA registration number 918962. "you" means the user of the Website.</span>
                </p>
              </div>
            </section>

            {/* 2. Software restrictions */}
            <section id="sec-software" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">2.</span> Software restrictions
              </h2>
              <p>
                Any software that may be made available to use from this Website (”Software”) is the copyrighted work of Landlord Vision Limited. Use of the Software is governed by the terms of the <a href="https://www.landlordvision.co.uk/index/eula-popup/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">End User Licence Agreement</a> (”Licence Agreement”). An end user agrees to the Licence Agreement terms by installing, copying, or using the Software. The Software is made available solely for use by end users according to the Licence Agreement.
              </p>
              <p>
                Without limiting the foregoing, the copying or reproduction of the Software to any other server or location for further reproduction or redistribution is expressly prohibited. Any reproduction or redistribution of the Software not in accordance with the Licence Agreement is expressly prohibited by law, and may result in severe civil and criminal penalties. The owners of the Software will prosecute any and all violators to the maximum extent possible.
              </p>
              <p>
                Use of the Website and the Services is also subject to Landlord Vision’s <a href="https://www.landlordvision.co.uk/index/fair-usage-policy-popup/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">Fair Usage Policy</a>, published on the Website, which is incorporated into these Terms and Conditions by reference. Any breach of the Fair Usage Policy will also constitute a breach of these Terms and Conditions.
              </p>
              <p>
                The software is warranted, if at all, only according to the terms of the licence agreement. Except as may be expressly warranted in the licence agreement, Landlord Vision hereby disclaims all express or implied representations, warranties, guaranties, and conditions with regard to the software, including but not limited to any implied representations, warranties, guaranties, and conditions of merchantability, fitness for a particular purpose, title and non-infringement, except to the extent that such disclaimers are held to be legally invalid.
              </p>
            </section>

            {/* 3. Copyright */}
            <section id="sec-copyright" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">3.</span> Copyright
              </h2>
              <p>
                Landlord Vision assumes the copyright of its products and, subject to the Limitation of liability section below, they do not accept liability for any direct, indirect, special, consequential or other losses or damages of whatsoever kind arising out of using their products or any information, downloads or links contained in it, save that nothing in this section excludes or limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under applicable law. The Landlord Vision online software solution itself is provided 'as is' without express or implied warranty.
              </p>
              <p>
                Landlord Vision reserves the right to alter any of the company's products or published technical data relating thereto at any time without notice.
              </p>
            </section>

            {/* 4. Privacy Notice */}
            <section id="sec-privacy" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">4.</span> Privacy Notice
              </h2>
              <p>
                Please see our{' '}
                <Link to="/privacy-notice" className="font-semibold text-[#04A26F] hover:underline">
                  Privacy Notice
                </Link>{' '}
                to see how we deal with our Data.
              </p>
            </section>

            {/* 5. Who owns my Data? */}
            <section id="sec-who-owns-data" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">5.</span> Who owns my Data?
              </h2>
              <p>
                Other than the rights and interests expressly set forth in this Agreement by Landlord Vision, you own your data and retain all rights, title, and interest in the data you store with Landlord Vision.
              </p>
              <p>
                You grant to Landlord Vision a non-exclusive, royalty-free licence to use anonymised and/or aggregated information derived from your tenanted property details for the purposes of our own self-promotion and marketing, including but not limited to including the general location (but not address) of a property on our website. Landlord Vision will not disclose information about identifiable individuals or properties, but we may provide aggregate information (for example, we may confirm that 50 tenanted properties are located within a certain town or country). This licence, and our use of such information, is subject to the anonymisation and aggregation commitments and safeguards described in our{' '}
                <Link to="/privacy-notice" className="font-semibold text-[#04A26F] hover:underline">
                  Privacy Notice
                </Link>
                , which takes precedence in the event of any inconsistency.
              </p>
              <p>
                Please note that backend data storage and back-office processing of this data may be carried out by a contracted operational support provider located outside the United Kingdom, acting as Landlord Vision’s processor, subject to the safeguards described in our{' '}
                <Link to="/privacy-notice" className="font-semibold text-[#04A26F] hover:underline">
                  Privacy Notice
                </Link>
                .
              </p>
            </section>

            {/* 6. Rental agreement */}
            <section id="sec-rental-agreement" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">6.</span> Rental agreement
              </h2>
              <p>
                The monthly subscription fee for Landlord Vision may, depending on the product, commence with a pro rata payment firstly and will be collected immediately. The first full monthly fee for the product will be collected by Direct Debit from your account at the beginning of the following month. All subsequent payments will also be taken monthly.
              </p>
              <p>
                For products with a two-week free trial, there will be no pro rata payment and the monthly payments will be collected immediately either via Direct Debit or recurring credit card payments after the free trial comes to an end.
              </p>
              <p>
                Landlord Vision subscription payments shall be collected directly from your bank account or credit card via Direct Debit or recurring credit card payments, using our secure payment partners GoCardless and Chargebee. If any of your payments fail due to lack of funds then you will be notified of this via ourselves and our partners. In order to continue using Landlord Vision you will need to make the payment that is due.
              </p>
              <p>
                Landlord Vision will give customers fourteen (14) days grace period to continue using the software. If the payment has not been made within fourteen (14) days, Landlord Vision will automatically lock your account. You will need to continue making the rental payments to regain access to Landlord Vision.
              </p>
              <p>
                If the payment is not made within one (1) month of the last successful payment then the payment agreement/subscription will be cancelled and you will need to set up a new subscription agreement to regain access to Landlord Vision.
              </p>
              <p>
                If a Landlord Vision account remains unused for six (6) months without any payments, then it will be deleted. This means that all the data stored within the account will also be deleted and you will need to restart a new account and re-enter all data again should you wish to continue using Landlord Vision.
              </p>
              <p>
                Landlord Vision may change the prices of our recurring subscription fees from time to time. In the event of a change, we aim to give all of our customers sufficient notice via email, detailing the date that the change will take effect and how to contact Landlord Vision to discuss the options available to them.
              </p>
            </section>

            {/* 7. Billing */}
            <section id="sec-billing" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">7.</span> Billing
              </h2>
              <p>
                Payments may be made via Direct Debit or Credit Card only. Your Landlord Vision subscription will automatically be re-billed monthly or annually, depending on your subscription term. Any billing cancellations or changes will be actioned before the next billing date provided that you notify us in writing five clear working days before payment is due.
              </p>
              <p>
                References in the End User Licence Agreement to the “Subscription Period” mean the billing interval (for example, monthly, or such other interval as you may otherwise select) applicable to your chosen Plan under these Terms and Conditions from time to time, so that the billing cadence under both agreements remains aligned.
              </p>
            </section>

            {/* 8. Renewing your subscription/agreement */}
            <section id="sec-renewing" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">8.</span> Renewing your subscription/agreement
              </h2>
              <p>
                If your subscription is renewed within one month of the last successful payment then you will be able to renew at the price you had previously been paying.
              </p>
              <p>
                If your rental agreement is renewed after one month of the last successful payment, then you will need to renew at the current Landlord Vision prices. This means that if the software price has increased since you originally took out the rental payment option then you will need to re-join at the current price.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-gray-900">Landlord Vision provides four plans:</p>
                <ul className="list-disc pl-5 font-semibold text-[#04A26F]">
                  <li>Starter</li>
                  <li>Standard</li>
                  <li>Premium</li>
                  <li>Enterprise</li>
                </ul>
                <p className="text-gray-500 pt-1">The benefits of these plans are displayed on the Landlord Vision website.</p>
              </div>
            </section>

            {/* 9. General plan terms */}
            <section id="sec-general-plan" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">9.</span> General plan terms
              </h2>
              <p>
                All the applicable prices for our Plans are displayed on our Website. Time is of the essence in relation to all payments. Landlord Vision offers a money back guarantee on new subscriptions only and will provide, on written request, a full refund for customers who cancel during the first sixty (60) days of their subscription. Every Landlord Vision customer is entitled to ONLY one 60-day guarantee.
              </p>
              <p>
                If you are a consumer, you may also have a statutory right to cancel your contract for the Services within fourteen (14) days without giving any reason, under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013. The scope and operation of this statutory cancellation right is set out in the corresponding cancellation rights clause of the End User Licence Agreement. This statutory right is in addition to, and does not affect, the sixty (60) day money back guarantee described above; to the extent the two rights overlap, you may rely on whichever is more favourable to you.
              </p>
              <p>
                Annual subscriptions are offered at a discounted rate in return for a twelve-month commitment. You may cancel your annual subscription at any time; however, cancellation will take effect at the end of the current subscription period, and no refund (whether in whole or pro rata) will be provided for the unused portion of the term. Following cancellation, you will continue to have full access to the service until the end of the period you have paid for, and your subscription will simply not renew. This does not affect your statutory rights, including any right to cancel within 14 days of initial purchase where applicable, nor your right to a refund where we terminate the service or fail to provide it in accordance with these terms. For these purposes, “Services” and “Consumer” have the meanings given to them in the End User Licence Agreement.
              </p>
              <p>
                The purchase of Signable envelopes through Landlord Vision is nonrefundable and no credits will be given for any unused envelopes.
              </p>
              <p>
                The Plans displayed on the Website represent the full services being provided. Any extra benefits must be agreed with Landlord Vision and additional fees may be required.
              </p>
              <p>
                All Plans shall auto renew for additional terms equivalent to your original term unless at least 5 clear working days' written termination notice is received by Landlord Vision prior to the expiration of any term.
              </p>
              <p>
                If you wish to cancel a Plan for whatever reason, you will remain liable for (a) any Plan fees that have already fallen due and are unpaid as at the date of cancellation, and (b) a reasonable administration charge, not exceeding Landlord Vision’s genuine pre-estimate of the costs and losses reasonably and directly arising from the early cancellation. Any such charge is intended to be a genuine, proportionate pre-estimate of loss reflecting Landlord Vision’s legitimate interest in being compensated for early cancellation, and not a penalty. Landlord Vision will not seek to recover the full, unaccrued term price save to the extent that this reflects such a genuine pre-estimate of loss. Nothing in this section limits or excludes any rights you may have as a consumer under the Consumer Rights Act 2015 or other applicable statutory protections, and to the extent any provision of this section is inconsistent with those protections as they apply to you, that provision shall not apply.
              </p>
              <p>
                These Terms and Conditions constitute the sole and exclusive contract between the parties, and supersede any and all prior oral or written and all contemporaneous oral, contracts, promises, or understandings among them, pertaining to the transactions contemplated in these Terms and Conditions. The parties agree that no express or implied representations, warranties, or inducements have been made by any party to any other party except as set forth in these Terms and Conditions.
              </p>
              <p>
                If you avail of a Free Plan and you do not access the Plan for a period of six (6) months then your subscription and all data will be deleted. If you avail of a cancelled paid Plan, your subscription and all data will be deleted six (6) months after the subscription expiry date.
              </p>
            </section>

            {/* 10. Discount codes */}
            <section id="sec-discount-codes" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">10.</span> Discount codes
              </h2>
              <p>
                The promotional code field found on the online order form enables you to enter ONE (1) discount code per Landlord Vision Subscription only. Where a code stipulates a particular Landlord Vision plan, you will be able to redeem the discount against that plan only.
              </p>
            </section>

            {/* 11. Support */}
            <section id="sec-support" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">11.</span> Support
              </h2>
              <p>
                All Landlord Vision users are entitled to free support as part of their subscription. This includes telephone, chat and email support.
              </p>
            </section>

            {/* 12. Account cancellations */}
            <section id="sec-cancellations" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">12.</span> Account cancellations
              </h2>
              <p>
                If you cancel a paid Landlord Vision subscription plan, then it will be permanently deleted six (6) months after the subscription expiry date.
              </p>
              <p>
                If you have a 'Free' Landlord Vision subscription plan, and it is not accessed for six months, then it will be permanently deleted.
              </p>
              <p>
                Where accounts have been deleted, a user will be able to start a new subscription with new data should they wish to do so in the future.
              </p>
              <p>
                For the avoidance of doubt, the six (6) month periods referred to above govern only the deletion of your live account and your access to your data through the Website. They are without prejudice to, and do not shorten, any separate data retention periods maintained by Landlord Vision in accordance with the{' '}
                <Link to="/privacy-notice" className="font-semibold text-[#04A26F] hover:underline">
                  Privacy Notice
                </Link>{' '}
                (for example, for backup, legal, accounting or record-keeping purposes).
              </p>
            </section>

            {/* 13. Back-ups */}
            <section id="sec-backups" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">13.</span> Back-ups
              </h2>
              <p>
                Full data backups are performed automatically daily on all accounts and each backup copy is kept for 31 days. On the paid subscription plans, customers are entitled to an individual database restore service.
              </p>
              <p>
                Storage of your data and media on the Website is also subject to the storage constraints and Fair Use Baseline set out in Landlord Vision’s <a href="https://www.landlordvision.co.uk/index/fair-usage-policy-popup/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">Fair Usage Policy</a>.
              </p>
            </section>

            {/* 14. Warranty */}
            <section id="sec-warranty" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">14.</span> Warranty
              </h2>
              <p>
                You acknowledge and agree that the Website is being provided for use as is, and therefore, subject to the Limitation of liability section below and without prejudice to your statutory rights as a consumer under the Consumer Rights Act 2015, you will not have any plea, claim or demand against Landlord Vision in respect to the Website’s properties, limitations or compatibility with your needs. The use of the Website is accordingly being made at your sole and entire risk, without warranties of merchantability, fitness for a particular purpose, non-infringement, compatibility, security or accuracy, save that nothing in this section excludes or limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under applicable law.
              </p>
              <p>
                Landlord Vision does not warrant the validity, accuracy, completeness, safety, legality, quality, or applicability of the Content streamed from any other third party host websites or anything said or written by its Providers, including any information contained in any Provider listing. Landlord Vision will not be liable for any damages sustained due to reliance on such information provided by any Provider.
              </p>
            </section>

            {/* 15. Indemnity */}
            <section id="sec-indemnity" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">15.</span> Indemnity
              </h2>
              <p>
                You agree to defend, indemnify and hold Landlord Vision and (as applicable) its officers, directors, employees, agents, subsidiaries, affiliates, suppliers and any of our third party information service providers or other representatives harmless against any and all claims demands, losses, expenses, damages and costs, including legal costs, however arising resulting from any violation or breach by you of these Terms and Conditions or any claims made by or liabilities to any third party resulting from any activities conducted under your account, your use or misuse of the Website, including but not limited to posting content on the Website, entering into transactions with other website users, contacting others as a result of their postings on the Website, infringing any third party's intellectual property or other rights, or otherwise arising out of your breach of these Terms and Conditions.
              </p>
            </section>

            {/* 16. Major incident reporting to the FCA */}
            <section id="sec-fca-incidents" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">16.</span> Major incident reporting to the FCA
              </h2>
              <p>
                As a business regulated by the Financial Conduct Authority under registration number 918962, Landlord Vision will use the following criteria to determine if an incident is ‘major’ and as such is reportable to the FCA:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                <li>If any sensitive data (including but not limited to users’ names with address, users’ bank account numbers, bank account sort code as well as the content of users’ bank transactions) is stolen or made public then the incident will be immediately considered a ‘major’ incident and reported to the FCA using the procedure below;</li>
                <li>Any other incident which may cause harm to users, or impact users’ confidence in the Organisation’s security, will be reported to the Board immediately. Once any potential harm or potential impact on users’ confidence in security is confirmed by the Board, the incident will be defined as a major incident and will become reportable.</li>
              </ul>
              <p>
                If Landlord Vision becomes aware of a major operational or security incident, Landlord Vision will notify the FCA within 4 hours of detecting the incident, referencing its FCA registration number 918962. If the incident has or may have an impact on the financial interests of its account information service users, Landlord Vision will without undue delay inform its account information service users of the incident and of all measures that they can take to mitigate the adverse effects of the incident.
              </p>
              <p>
                Landlord Vision will then send an intermediate report 3 business days from the initial report, and any further intermediate reports 3 days from the last report until a final report is submitted to close the incident.
              </p>
              <p>
                Landlord Vision will also conduct a root cause analysis to determine the cause of the major issue. Once this analysis has been complete, a final report will be submitted to the FCA under Landlord Vision’s registration number 918962. All reports will be made via the Connect system.
              </p>
            </section>

            {/* 17. Regulatory status and complaints */}
            <section id="sec-regulatory" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">17.</span> Regulatory status and complaints
              </h2>
              <p>
                Landlord Vision is entered on the Financial Conduct Authority’s Financial Services Register under registration number 918962. Details of our registration can be viewed at <a href="https://register.fca.org.uk/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">https://register.fca.org.uk/</a>.
              </p>
              <p>
                As Landlord Vision is regulated by the Financial Conduct Authority in respect of its account information services, if you are unhappy with how we have resolved a complaint relating to those regulated services, you may be entitled to refer your complaint to the Financial Ombudsman Service.
              </p>
              <p className="text-xs text-gray-500 font-medium">
                In this section, “Services” and “Consumer” have the meanings given to them in the End User Licence Agreement.
              </p>
            </section>

            {/* 18. Disclaimer */}
            <section id="sec-disclaimer" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">18.</span> Disclaimer
              </h2>
              <p className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium">
                Landlord Vision Limited is not a financial, legal or tax advisor and cannot give financial or other professional advice. If such advice is needed we urge you to seek the opinion of an appropriate professional in the relevant field. We care about your success and therefore encourage you to take appropriate advice before you put any of your resources, financial or otherwise at risk.
              </p>
            </section>

            {/* 19. Limitation of liability */}
            <section id="sec-liability" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">19.</span> Limitation of liability
              </h2>
              <p>
                Subject to the paragraph below, Landlord Vision’s total liability to you for any loss or damage arising out of or in connection with these Terms and Conditions or your use of the Website, whether in contract, tort (including negligence), breach of statutory duty or otherwise, shall not exceed the total fees paid by you to Landlord Vision for the Services in the twelve (12) months preceding the event giving rise to the claim.
              </p>
              <p>
                Nothing in these Terms and Conditions excludes or limits Landlord Vision’s liability for death or personal injury caused by its negligence, for fraud or fraudulent misrepresentation, for any other liability that cannot be excluded or limited under applicable law, for breach of its confidentiality obligations under these Terms and Conditions, or for breach of any applicable data protection legislation.
              </p>
            </section>

            {/* 20. Digital content */}
            <section id="sec-digital-content" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">20.</span> Digital content
              </h2>
              <p>
                If you are a consumer, the online software made available to you through the Website constitutes ‘digital content’ for the purposes of Chapter 3 of the Consumer Rights Act 2015. Accordingly, you have statutory rights that such digital content is of satisfactory quality, fit for any particular purpose made known to Landlord Vision, and as described, together with associated remedies (which may include repair or replacement, a price reduction, or a refund) where those rights are not met. Nothing in this section affects the disclaimers set out elsewhere in these Terms and Conditions, save to the extent required by applicable law.
              </p>
            </section>

            {/* 21. Legal documents */}
            <section id="sec-legal-docs" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">21.</span> Legal documents
              </h2>
              <p>
                Landlord Vision also offers you the opportunity through our Software to access and utilise third party Legal Documents, which are provided by <a href="https://www.netlawman.co.uk" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.netlawman.co.uk</a> and <a href="https://www.legislate.ai" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#04A26F] hover:underline">www.legislate.ai</a>.
              </p>
              <p>
                Landlord Vision makes no representation or warranty that any Legal Documents will be suitable for your intended use as we are not aware of your particular legal requirements. You should always consult a legal professional regarding your use of the Legal Documents.
              </p>
              <p>
                Landlord Vision shall not be liable to you for any loss or expense which is: indirect or consequential loss; or economic loss, or other loss of turnover, profits, business or goodwill even if such loss was reasonably foreseeable or we knew you might incur it, save that nothing in this paragraph excludes or limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under applicable law. This paragraph (and any other paragraph which excludes or restricts our liability) applies to our directors, officers, employees, subcontractors, agents and affiliated companies.
              </p>
              <p>
                The Legal Documents are available on an “as is” basis and Landlord Vision makes no representation and gives no warranty that the third party Legal Documents that you have access to in our Software are provided by solicitors or barristers in practice. Even if the Legal Documents are drafted by a practising solicitor or barrister this does not of itself indicate that the service is suitable for your use.
              </p>
              <p>
                Please note that legislation is subject to constant change so it is your responsibility to ensure that your document reflects any future changes. Landlord Vision does not have the expertise to advise on any legal matters. By utilising the Legal Documents you are therefore automatically agreeing to the terms and conditions of www.netlawman.co.uk and www.legislate.ai, which can be viewed on their website.
              </p>
              <p>
                The Legal Documents may include technical inaccuracies or typographical errors. Landlord Vision is not responsible for any action you decide to take as a result of utilising the Legal Documents. Legal Documents produced by www.netlawman.co.uk and www.legislate.ai are valid only within the jurisdiction of the United Kingdom. You agree to indemnify, defend and hold harmless Landlord Vision against all third party claims, liability, damages, costs and expenses, including legal fees, arising out of your use of the Legal Documents.
              </p>
            </section>

            {/* 22. Tax reports */}
            <section id="sec-tax-reports" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">22.</span> Tax reports
              </h2>
              <p>
                Landlord Vision also offers you the opportunity through our Website to generate Tax Reports which are in accordance with HMRC Guidelines.
              </p>
              <p>
                Landlord Vision makes no representation or warranty that any Tax Reports will be suitable for your intended use. You should always consult a Tax professional for specialist Tax advice.
              </p>
              <p>
                The Tax Reports are available on an “as is” basis and Landlord Vision makes no representation and gives no warranty that the reports have been produced by qualified Tax professionals.
              </p>
              <p>
                The total liability of Landlord Vision for any Tax Reports that you purchase is the actual amount of the purchase. Landlord Vision shall not be liable to you for any loss or expense which is: indirect or consequential loss; or economic loss or other loss of turnover, profits, business or goodwill even if such loss was reasonably foreseeable or we knew you might incur it, save that nothing in this paragraph excludes or limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under applicable law. This paragraph (and any other paragraph which excludes or restricts our liability) applies to our directors, officers, employees, subcontractors, agents and affiliated companies.
              </p>
              <p>
                You agree to indemnify, defend and hold harmless Landlord Vision against all third party claims, liability, damages, costs and expenses, including legal fees, arising out your generation of Tax reports.
              </p>
              <p>
                Please note that legislation is subject to constant change so it is your responsibility to ensure that your Tax report reflects any future changes. Landlord Vision does not have the expertise to advise on any Tax matters. Landlord Vision is not responsible for any action you decide to take as a result of generating Tax reports on our Website. Tax reports are only intended to be valid within the jurisdiction of the United Kingdom.
              </p>
            </section>

            {/* 23. Applicable law */}
            <section id="sec-applicable-law" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">23.</span> Applicable law
              </h2>
              <p>
                These terms and conditions shall be governed by and construed in accordance with the Laws of England and Wales. You consent to the exclusive jurisdiction of the courts of England and Wales to settle any disputes in connection with or arising out of the use of the Website.
              </p>
            </section>

            {/* 24. Assignment */}
            <section id="sec-assignment" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">24.</span> Assignment
              </h2>
              <p>
                You may not assign your rights or obligations under these terms and conditions to any third party.
              </p>
              <p>
                Landlord Vision may assign, novate, sub-contract, charge or otherwise transfer any or all of its rights and/or obligations under these terms and conditions, without your consent, to any of its affiliates or to any third party in connection with a sale, merger, reorganisation or other transfer of all or substantially all of the relevant business or assets.
              </p>
            </section>

            {/* 25. Waiver */}
            <section id="sec-waiver" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">25.</span> Waiver
              </h2>
              <p>
                The failure of Landlord Vision to enforce any strict provision of any of these Terms and Conditions will not constitute a waiver of its right to subsequently enforce such a provision or any other term or conditions.
              </p>
            </section>

            {/* 26. Third party content */}
            <section id="sec-third-party-content" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">26.</span> Third party content
              </h2>
              <p>
                The Website provides links to other websites and access to content, Content and services from third parties. Landlord Vision is not responsible for the availability of, or content provided on, such third party websites. You should refer to the policies posted by other websites regarding privacy and other topics before you use them. You acknowledge and agree that Landlord Vision is not responsible for third party content accessible from the Website and that you bear all risks associated with such content.
              </p>
            </section>

            {/* 27. Advertisements */}
            <section id="sec-advertisements" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">27.</span> Advertisements
              </h2>
              <p>
                Landlord Vision may include in the Website, advertisements on its own behalf or paid advertisements on behalf of interested companies and/or individuals. By clicking on the advertisements, the User may be shifted to a web site of the advertiser or receive other messages, information or offers from the advertiser. You acknowledge and agree that Landlord Vision is not liable for the privacy practices of advertisers or the content of their web sites, information, messages or offers. You are wholly liable for all communications with advertisers and for all transactions subsequently executed.
              </p>
            </section>

            {/* 28. Severability */}
            <section id="sec-severability" className="scroll-mt-24 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">28.</span> Severability
              </h2>
              <p>
                If any of the provisions of these terms and conditions is found by a court or other competent authority to be void or unenforceable such provision shall be deemed to be deleted from the terms and conditions and the remaining provisions of the terms and conditions shall remain in full force and effect.
              </p>
            </section>

            {/* 29. Notices */}
            <section id="sec-notices" className="scroll-mt-24 space-y-4 pt-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-[#04A26F]">29.</span> Notices
              </h2>
              <p>
                All notices and communications shall be sent to and by the Licensor either by post to our premises at <strong>Licensor, 3 Sanderson Close, Great Sankey, Warrington, Cheshire, WA5 3LN</strong> or by email to <a href="mailto:info@landlordvision.co.uk" className="font-semibold text-[#04A26F] hover:underline">info@landlordvision.co.uk</a>. Such notice will be deemed received 3 days after posting if sent by first class post, the day of sending if the email is received in full on a business day and on the next business day if the email is sent on a weekend or public holiday.
              </p>

              <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-6 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Questions about these Terms?</h3>
                  <p className="text-xs text-gray-600">Landlord Vision customer support is here to help.</p>
                  <p className="text-xs text-gray-500 mt-1">3 Sanderson Close, Great Sankey, Warrington, Cheshire, WA5 3LN</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs text-xs font-semibold text-gray-800">
                  <Mail className="w-4 h-4 text-[#04A26F]" />
                  <span>Email: <a href="mailto:info@landlordvision.co.uk" className="text-[#04A26F] font-semibold hover:underline">info@landlordvision.co.uk</a></span>
                </div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* PAGE FOOTER WITH BOTTOM BACK TO REGISTER LINK */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Landlord Vision Limited. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/register" className="text-[#04A26F] font-semibold hover:underline">
              Back to Register
            </Link>
            <span>&bull;</span>
            <Link to="/privacy-notice" className="text-gray-600 hover:underline">
              Privacy Notice
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
