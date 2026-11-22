import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// DELETE /api/achievements/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 등록된 이미지가 있다면 스토리지에서도 함께 정리
  const { data: item } = await supabase
    .from('achievements')
    .select('image_url')
    .eq('id', id)
    .single()

  if (item?.image_url) {
    try {
      const parts = item.image_url.split('/achievements/')
      if (parts[1]) {
        await supabase.storage.from('achievements').remove([parts[1]])
      }
    } catch (e) {
      console.error('Failed to remove image from storage:', e)
    }
  }

  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
