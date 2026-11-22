import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/message → DB에서 문구 읽기
export async function GET() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'main_message')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: data.value })
}

// POST /api/message → DB에 문구 저장
export async function POST(request: Request) {
  const { message } = await request.json()

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: '문구를 입력해주세요' }, { status: 400 })
  }

  const { error } = await supabase
    .from('settings')
    .update({ value: message })
    .eq('key', 'main_message')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
