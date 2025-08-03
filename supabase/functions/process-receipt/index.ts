import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();

    if (!imageData) {
      throw new Error('No image data provided');
    }

    console.log('Processing receipt with OpenAI Vision API');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a receipt parser. Extract items from receipt images and return a JSON array of objects with this exact structure:
            [
              {
                "id": "unique_id",
                "name": "item_name",
                "price": number
              }
            ]
            
            Rules:
            - Only return valid JSON, no other text
            - Extract only food/product items, not taxes, tips, or totals
            - Use descriptive names for items
            - Prices should be numbers (e.g., 12.99, not "$12.99")
            - Generate unique IDs for each item
            - If you can't read the receipt clearly, return an empty array []`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all items and their prices from this receipt:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response:', content);

    let items;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      items = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      items = [];
    }

    // Validate the structure
    if (!Array.isArray(items)) {
      items = [];
    }

    // Ensure each item has the required fields
    items = items.filter(item => 
      item && 
      typeof item.name === 'string' && 
      typeof item.price === 'number' && 
      item.name.trim() !== ''
    ).map(item => ({
      id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name.trim(),
      price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
      assignedTo: []
    }));

    console.log('Processed items:', items);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-receipt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      items: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});