const config = require('../config/env');

/**
 * Generate a complete trip itinerary using Google Gemini API or OpenRouter API
 */
async function generateItinerary({
  destination,
  startDate,
  endDate,
  budgetLimit = 2000,
  currency = 'USD',
  travelStyle = 'Balanced',
  travelersCount = 1,
  tripName = '',
  notes = '',
}) {
  const geminiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
  const openrouterKey = process.env.OPENROUTER_API_KEY || config.openrouterApiKey;

  if (!geminiKey && !openrouterKey) {
    throw new Error('Gemini API Key is missing. Please add GEMINI_API_KEY="" to your backend/.env file.');
  }

  // Calculate days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const prompt = `You are an expert AI Travel Planner for VoyageIQ.
Create a detailed, realistic travel itinerary for the following trip:
- Destination(s): ${destination}
- Start Date: ${startDate}
- End Date: ${endDate} (${numDays} days total)
- Budget: ${currency} ${budgetLimit} total for ${travelersCount} traveler(s)
- Travel Style: ${travelStyle}
- Trip Name: ${tripName || destination}
${notes ? `- Preferences/Notes: ${notes}` : ''}

Respond STRICTLY with a raw JSON object (no markdown surrounding ticks, just pure JSON).
The JSON MUST follow this exact schema:
{
  "tripName": "string",
  "summary": "string",
  "estimatedTotalCost": number,
  "currency": "${currency}",
  "coverImage": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
  "cities": [
    {
      "name": "City Name, Country",
      "arrivalDate": "YYYY-MM-DD",
      "departureDate": "YYYY-MM-DD",
      "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
      "activities": [
        {
          "title": "Activity Title",
          "date": "YYYY-MM-DD",
          "time": "HH:MM",
          "cost": number,
          "category": "sightseeing",
          "location": "Address or neighborhood",
          "notes": "Short helpful tip or detail"
        }
      ]
    }
  ]
}

Make sure:
1. Activity categories MUST be one of: sightseeing, food, adventure, culture, shopping, entertainment, transport, accommodation, activity.
2. Keep costs realistic so total cost fits inside ${currency} ${budgetLimit}.
3. Generate 2 to 4 activities per day across the dates ${startDate} to ${endDate}.`;

  let lastError = null;

  // 1. Try Direct Google Gemini API first if GEMINI_API_KEY is available
  if (geminiKey) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

    for (const model of geminiModels) {
      try {
        console.log(`[AI Service] Calling Google Gemini API (model: ${model})...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[Gemini API] Model ${model} failed (${response.status}):`, errorText);
          lastError = new Error(`Google Gemini API error (${response.status}): ${errorText}`);
          continue;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          lastError = new Error('Empty response received from Gemini API.');
          continue;
        }

        const cleaned = content
          .replace(/^\s*```json/gi, '')
          .replace(/^\s*```/gi, '')
          .replace(/```\s*$/gi, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (err) {
        console.warn(`[Gemini API] Error trying model ${model}:`, err.message);
        lastError = err;
      }
    }
  }

  // 2. Fallback to OpenRouter if OPENROUTER_API_KEY is available
  if (openrouterKey) {
    const candidateModels = [
      'google/gemini-2.5-flash',
      'openai/gpt-4o-mini',
      'meta-llama/llama-3.3-70b-instruct',
    ];

    for (const model of candidateModels) {
      try {
        console.log(`[AI Service] Calling OpenRouter model: ${model}...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'VoyageIQ Travel Planner',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a professional travel planner API that strictly returns valid JSON objects.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[OpenRouter] Model ${model} failed (${response.status}):`, errorText);
          lastError = new Error(`OpenRouter API error (${response.status}): ${errorText}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          lastError = new Error('Empty response received from OpenRouter API.');
          continue;
        }

        const cleaned = content
          .replace(/^\s*```json/gi, '')
          .replace(/^\s*```/gi, '')
          .replace(/```\s*$/gi, '')
          .trim();

        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (err) {
        console.warn(`[OpenRouter] Error trying model ${model}:`, err.message);
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Failed to generate itinerary with AI. Please verify your GEMINI_API_KEY in backend/.env.');
}

module.exports = {
  generateItinerary,
};
