import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleCloudVisionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');

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

    let content = '';
    let useOcr = true;

    // Step 1: Try OCR first
    try {
      console.log('Processing receipt with Google Cloud Vision OCR');
      
      // Convert base64 to just the data part if it includes the data URL prefix
      const base64Data = imageData.startsWith('data:') ? 
        imageData.split(',')[1] : imageData;

      const ocrResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudVisionApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Data
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        }),
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR API error: ${ocrResponse.status}`);
      }

      const ocrData = await ocrResponse.json();
      const extractedText = ocrData.responses[0]?.textAnnotations?.[0]?.description;
      
      if (extractedText) {
        console.log('OCR extracted text:', extractedText);
        
        // Step 2: Use GPT-4o to analyze the OCR text
        console.log('Analyzing OCR text with GPT-4o');
        
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a receipt parser. Extract items and their final prices from the provided receipt text. Return a JSON array of objects with "name" and "price" fields. Only include actual purchasable items, not taxes, tips, or totals.'
              },
              {
                role: 'user',
                content: `Parse this receipt text and extract the items with their final prices:\n\n${extractedText}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.1
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          content = aiData.choices[0].message.content;
          console.log('AI analysis of OCR text:', content);
        } else {
          throw new Error('AI analysis failed');
        }
      } else {
        throw new Error('No text extracted from OCR');
      }
    } catch (ocrError) {
      console.log('OCR failed, falling back to vision API:', ocrError.message);
      useOcr = false;
      
      // Fallback: Use GPT-4o Vision API directly
      console.log('Processing receipt with OpenAI Vision API (fallback)');
      
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
              content: 'You are a receipt parser. Extract items and their final prices from the receipt image. Return a JSON array of objects with "name" and "price" fields. Only include actual purchasable items, not taxes, tips, or totals.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the items and their final prices from this receipt image.'
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
      content = data.choices[0].message.content;
      console.log('Vision API response:', content);
    }

    // Convert the response to a structured format
    let parseResult;
    try {
      // Try to parse as JSON first
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parseResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.log('Response is not JSON, processing as text:', content);
      
      // If not JSON, process the text response to extract items
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const items = [];
      
      for (const line of lines) {
        // Look for price patterns in the text
        const priceMatch = line.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
        if (priceMatch) {
          // Convert Indonesian price format to number
          let price = priceMatch[1].replace(/\./g, '').replace(/,/g, '.');
          price = parseFloat(price);
          
          if (!isNaN(price) && price > 0) {
            // Extract item name (text before the price)
            const nameMatch = line.match(/^(.*?)(?:\s+\d)/);
            const name = nameMatch ? nameMatch[1].trim() : line.replace(priceMatch[0], '').trim();
            
            if (name) {
              items.push({
                id: `item_${Math.random().toString(36).substr(2, 9)}`,
                name: name,
                price: price,
                originalPrice: null,
                discount: null,
                type: 'food'
              });
            }
          }
        }
      }
      
      parseResult = { 
        items: items,
        hasSubtotal: false,
        subtotal: null,
        total: null
      };
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