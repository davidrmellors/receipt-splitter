import { NextRequest, NextResponse } from 'next/server'
import { parseReceiptImage } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    const parsedReceipt = await parseReceiptImage(imageData)

    return NextResponse.json(parsedReceipt)
  } catch (error: unknown) {
    console.error('Receipt parsing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse receipt' },
      { status: 500 }
    )
  }
}