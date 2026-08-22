const config = require('../config/env');

/**
 * Generate a realistic fallback itinerary if API key is missing or fails
 */
function generateFallbackItinerary({
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
  const destName = destination || 'Dream Destination';
  const start = new Date(startDate || new Date());
  const end = new Date(endDate || new Date(Date.now() + 86400000 * 4));
  const diffTime = Math.abs(end - start);
  const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const activitiesPool = [
    { title: `Explore ${destName} Historic Center & Landmarks`, category: 'sightseeing', cost: 25, time: '09:30', notes: 'Walking tour of iconic spots' },
    { title: `Local Culinary Tasting & Gourmet Lunch`, category: 'food', cost: 45, time: '12:30', notes: 'Sample traditional regional specialties' },
    { title: `Visit Famous City Museum & Art Gallery`, category: 'culture', cost: 20, time: '15:00', notes: 'Skip-the-line entrance ticket' },
    { title: `Sunset View & Rooftop Lounge Experience`, category: 'entertainment', cost: 35, time: '18:30', notes: 'Panoramic views over the skyline' },
    { title: `Morning Scenic Nature Trail & Parks`, category: 'adventure', cost: 15, time: '08:30', notes: 'Fresh air and scenic photography' },
    { title: `Traditional Artisan Market & Shopping`, category: 'shopping', cost: 50, time: '14:00', notes: 'Authentic local handicrafts and souvenirs' },
    { title: `Scenic Harbor Cruise or River Boat Ride`, category: 'sightseeing', cost: 40, time: '16:30', notes: 'Guided boat tour with audio commentary' },
    { title: `Fine Dining Evening Experience`, category: 'food', cost: 75, time: '20:00', notes: 'Recommended top-rated dining spot' },
  ];

  const cities = [];
  const cityCount = numDays > 4 ? 2 : 1;
  const daysPerCity = Math.ceil(numDays / cityCount);

  for (let c = 0; c < cityCount; c++) {
    const cityStart = new Date(start.getTime() + c * daysPerCity * 86400000);
    const cityEnd = new Date(Math.min(end.getTime(), cityStart.getTime() + (daysPerCity - 1) * 86400000));
    
    const cityName = cityCount === 1 
      ? destName 
      : `${destName} ${c === 0 ? 'Central' : 'Coastal & Surrounding'}`;

    const cityActivities = [];
    let actIndex = 0;

    for (let d = 0; d < daysPerCity; d++) {
      const curDate = new Date(cityStart.getTime() + d * 86400000);
      if (curDate > end) break;

      const dateStr = curDate.toISOString().split('T')[0];
      const dailyCount = 2 + (d % 2);

      for (let k = 0; k < dailyCount; k++) {
        const template = activitiesPool[actIndex % activitiesPool.length];
        actIndex++;

        cityActivities.push({
          title: `Day ${d + 1}: ${template.title}`,
          date: dateStr,
          time: template.time,
          cost: template.cost,
          category: template.category,
          location: cityName,
          notes: template.notes,
        });
      }
    }

    cities.push({
      name: cityName,
      arrivalDate: cityStart.toISOString().split('T')[0],
      departureDate: cityEnd.toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      activities: cityActivities,
    });
  }

  return {
    tripName: tripName || `Expedition to ${destName}`,
    summary: `A custom-tailored ${numDays}-day ${travelStyle.toLowerCase()} itinerary in ${destName} for ${travelersCount} traveler(s).`,
    estimatedTotalCost: Math.min(budgetLimit, cities.reduce((s, c) => s + c.activities.reduce((a, act) => a + act.cost, 0), 0)),
    currency,
    coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    cities,
  };
}

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
  if (geminiKey && geminiKey.trim() !== '') {
    const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

    for (const model of geminiModels) {
      try {
        console.log(`[AI Service] Calling Google Gemini API (${model})...`);
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
        console.log('[AI Service] Successfully generated itinerary via Gemini API!');
        return parsed;
      } catch (err) {
        console.warn(`[Gemini API] Error trying model ${model}:`, err.message);
        lastError = err;
      }
    }
  }

  // 2. Fallback to OpenRouter if OPENROUTER_API_KEY is available
  if (openrouterKey && openrouterKey.trim() !== '') {
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
        console.log('[AI Service] Successfully generated itinerary via OpenRouter API!');
        return parsed;
      } catch (err) {
        console.warn(`[OpenRouter] Error trying model ${model}:`, err.message);
        lastError = err;
      }
    }
  }

  // 3. Resilient fallback generator if API key is not supplied or calls fail
  console.warn('[AI Service] No valid API key configured or API calls returned an error. Using intelligent fallback itinerary generator.', lastError?.message);
  return generateFallbackItinerary({
    destination,
    startDate,
    endDate,
    budgetLimit,
    currency,
    travelStyle,
    travelersCount,
    tripName,
    notes,
  });
}

module.exports = {
  generateItinerary,
};
