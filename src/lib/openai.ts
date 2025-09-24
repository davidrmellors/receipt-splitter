import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ReceiptItem {
  name: string
  price: number
  quantity?: number
  category?: string
}

export interface ParsedReceipt {
  storeName?: string
  date?: string
  items: ReceiptItem[]
  subtotal?: number
  tax?: number
  total?: number
}

export async function parseReceiptImage(imageData: string): Promise<ParsedReceipt> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '')

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and extract the following information in JSON format:
              {
                "storeName": "store name if visible",
                "date": "date in YYYY-MM-DD format if visible",
                "items": [
                  {
                    "name": "item name",
                    "price": number,
                    "quantity": number (if specified, default 1),
                    "category": "food/drink/other"
                  }
                ],
                "subtotal": number (if visible),
                "tax": number (if visible),
                "total": number (if visible)
              }

              Guidelines:
              - Extract only clearly visible line items with prices
              - Ignore duplicate entries, headers, and footers
              - Convert all prices to numbers (remove currency symbols)
              - If quantity is not specified, assume 1
              - Categorize items as food, drink, or other
              - Return valid JSON only, no additional text`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      const parsedReceipt: ParsedReceipt = JSON.parse(content)

      // Validate the response
      if (!parsedReceipt.items || !Array.isArray(parsedReceipt.items)) {
        throw new Error('Invalid receipt format: missing items array')
      }

      // Validate each item
      parsedReceipt.items = parsedReceipt.items.filter(item =>
        item.name &&
        typeof item.price === 'number' &&
        item.price > 0
      ).map(item => ({
        ...item,
        quantity: item.quantity || 1,
        category: item.category || 'other'
      }))

      return parsedReceipt
    } catch {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Failed to parse receipt data')
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to process receipt image')
  }
}