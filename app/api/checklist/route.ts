import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface ProgressItem {
  r1: boolean
  r2: boolean
  r3: boolean
}

// GET /api/checklist → 전체 회독 진도 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('checklist_progress')
      .select('id, r1, r2, r3')

    if (error) {
      console.warn('Checklist fetch warning (table may not exist yet):', error.message)
      return NextResponse.json({ progress: {}, error: error.message }, { status: 200 })
    }

    const progressMap: Record<string, ProgressItem> = {}
    if (data) {
      for (const row of data) {
        progressMap[row.id] = {
          r1: Boolean(row.r1),
          r2: Boolean(row.r2),
          r3: Boolean(row.r3),
        }
      }
    }

    return NextResponse.json({ progress: progressMap })
  } catch (err: any) {
    return NextResponse.json({ progress: {}, error: err.message }, { status: 200 })
  }
}

// POST /api/checklist → 회독 체크 업데이트 (UPSERT)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, r1, r2, r3 } = body

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      id,
      updated_at: new Date().toISOString(),
    }
    if (typeof r1 === 'boolean') updatePayload.r1 = r1
    if (typeof r2 === 'boolean') updatePayload.r2 = r2
    if (typeof r3 === 'boolean') updatePayload.r3 = r3

    const { data, error } = await supabase
      .from('checklist_progress')
      .upsert(updatePayload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
