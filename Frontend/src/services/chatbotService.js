const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

const MODELS = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'minimax/minimax-m3:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'liquid/lfm-2.5-2.6b:free',
];

const SYSTEM_PROMPT = `You are the official LandlordVision AI Assistant.
LandlordVision is an all-in-one cloud-based residential property management software for landlords and property managers in the UK.

Key Knowledge Base:
- 14-Day Free Trial: Available for new users without immediate payment.
- Premium Plan: £39.97/month + VAT (billed annually with 15% discount). Includes 15 tenancies. Extra tenancies cost £1.30 + VAT per month.
- Other Plans: Starter, Standard, Premium, Enterprise.
- System Versions: Legacy Landlord Vision (signed up before Sept 2023) and Current Landlord Vision (signed up after Sept 2023).
- Features: Income & expense tracking, rent payment schedules, tax reports (UK SA105), safety certificates (Gas, EPC, EICR), document storage, open banking integration, tenant management.
- Support: Phone support at 01925 357 355 (Mon-Fri 9am-5pm), email info@landlordvision.co.uk, Support Ticket portal, and Learning Lounge guides.

Guidelines:
1. Always be polite, professional, concise, and helpful.
2. Provide clear, direct answers about LandlordVision software features, pricing, plans, login modes, and general UK landlord responsibilities.
3. Use markdown formatting (bold text, bullet points) where appropriate for clean readability.
4. Keep answers concise (under 150 words) unless detailed explanation is requested.`;

export async function sendMessageToOpenRouter(messages) {
  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin || 'https://www.landlordvision.co.uk',
          'X-Title': 'LandlordVision AI Assistant',
        },
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${model} failed with status ${response.status}: ${errText}`);
        lastError = new Error(`OpenRouter model ${model} error: ${response.status}`);
        continue; // Try next model
      }

      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
    } catch (err) {
      console.warn(`Network error trying model ${model}:`, err);
      lastError = err;
    }
  }

  // Fallback response if all AI models are offline/unreachable
  if (lastError) {
    return (
      "I'm currently having trouble connecting to my AI knowledge base. " +
      "However, you can reach our human support team directly at **01925 357 355** (9am-5pm Mon-Fri) or email **info@landlordvision.co.uk**. " +
      "You can also start your 14-day free trial on our Registration page!"
    );
  }
}
