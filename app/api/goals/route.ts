import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/goals
export async function GET() {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/goals
export async function POST(request: Request) {
  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })

  const { data, error } = await supabase
    .from('goals')
    .insert({ text: text.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
