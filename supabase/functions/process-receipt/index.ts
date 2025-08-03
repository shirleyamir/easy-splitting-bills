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
            content: `You are a receipt parser. Extract items from receipt images and return a JSON array with this structure:
            {
              "items": [
                {
                  "id": "unique_id",
                  "name": "item_name", 
                  "price": number,
                  "originalPrice": number | null,
                  "discount": number | null,
                  "type": "food" | "fee"
                }
              ],
              "hasSubtotal": boolean,
              "subtotal": number | null,
              "total": number | null
            }
            
            Rules:
            - Only return valid JSON, no other text
            - Extract ALL line items: food/products AND fees/taxes/service charges
            - Mark food items with "type": "food" and fees/taxes with "type": "fee"
            - For items with discounts/savings: set "originalPrice" to the original price, "discount" to the discount amount, and "price" to the final discounted price
            - For items without discounts: set "originalPrice" and "discount" to null, "price" to the actual price
            - For fees, include percentage in name if visible (e.g., "Service Charge (10%)", "Tax (8%)")
            - Set "hasSubtotal": true if there's a clear subtotal line before fees/taxes (look for variations like "Sub Total", "Subtotal", "Sub-Total", "Net Amount", "Amount")
            - Set "hasSubtotal": false if fees/taxes are just informational and total already includes them
            - Include subtotal and total amounts when visible (look for variations like "Total", "Grand Total", "Final Total", "Amount Due", "Total Amount", "Net Total")
            - Do NOT extract subtotals or final totals as line items - only individual items
            - Prices should be numbers (e.g., 12.99, not "$12.99")
            - Generate unique IDs for each item
            - If you can't read the receipt clearly, return {"items": [], "hasSubtotal": false, "subtotal": null, "total": null}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all items, taxes, service charges, and fees from this receipt:'
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

    let parseResult;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parseResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      parseResult = { items: [] };
    }

    // Extract items from the response
    let allItems = parseResult.items || parseResult || [];
    if (!Array.isArray(allItems)) {
      allItems = [];
    }

    // Separate food items and fees
    const foodItems = allItems.filter(item => 
      item && 
      typeof item.name === 'string' && 
      typeof item.price === 'number' && 
      item.name.trim() !== '' &&
      item.type === 'food'
    );

    const feeItems = allItems.filter(item => 
      item && 
      typeof item.name === 'string' && 
      typeof item.price === 'number' && 
      item.name.trim() !== '' &&
      item.type === 'fee'
    );

    console.log('Food items:', foodItems);
    console.log('Fee items:', feeItems);
    console.log('Has subtotal:', parseResult.hasSubtotal);

    // Calculate subtotal from food items
    const calculatedSubtotal = foodItems.reduce((sum, item) => sum + item.price, 0);
    
    // Prepare base food items
    let adjustedFoodItems = foodItems.map(item => ({
      id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name.trim(),
      price: Math.round(item.price * 100) / 100,
      assignedTo: []
    }));

    // Only apply fees proportionally if there's a clear subtotal structure
    // If hasSubtotal is false, it means the total already includes taxes/fees
    if (parseResult.hasSubtotal && calculatedSubtotal > 0 && feeItems.length > 0) {
      console.log('Applying fees proportionally since subtotal structure detected');
      for (const fee of feeItems) {
        const feePercentage = fee.price / calculatedSubtotal;
        adjustedFoodItems = adjustedFoodItems.map(item => ({
          ...item,
          price: Math.round((item.price * (1 + feePercentage)) * 100) / 100
        }));
      }
    } else {
      console.log('Not applying fees - either no subtotal structure or total already includes fees');
    }

    console.log('Final processed items:', adjustedFoodItems);

    return new Response(JSON.stringify({ items: adjustedFoodItems }), {
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