import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/achievements
export async function GET() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/achievements
export async function POST(request: Request) {
  const { text, emoji, image_url } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })

  const { data, error } = await supabase
    .from('achievements')
    .insert({
      text: text.trim(),
      emoji: emoji ?? '🏆',
      image_url: image_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
