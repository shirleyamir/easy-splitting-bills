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
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      throw new Error('No items provided');
    }

    console.log('Calculating final prices for items:', items);

    // Format items for the AI prompt
    const itemsList = items.map((item: any, index: number) => 
      `${index + 1}. ${item.name} - Rp ${item.price.toLocaleString('id-ID')}`
    ).join('\n');

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
            content: `You are a helpful assistant that calculates final prices for items. When given a list of items with prices, provide a clear breakdown and final total. Always format Indonesian Rupiah prices properly with thousand separators using dots (e.g., Rp 25.000). Return your response in a clear, organized format.`
          },
          {
            role: 'user',
            content: `can u tell me the final prices of these items?\n\nItems:\n${itemsList}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const calculation = data.choices[0].message.content;
    
    console.log('Final price calculation:', calculation);

    // Calculate the actual total
    const total = items.reduce((sum: number, item: any) => sum + item.price, 0);

    return new Response(JSON.stringify({ 
      calculation,
      total,
      itemCount: items.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-final-prices function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      calculation: 'Error calculating final prices'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});