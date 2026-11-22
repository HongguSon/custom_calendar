import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 })
    }

    // 파일 크기 체크 (최대 20MB)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '파일 용량이 초과되었습니다. (최대 20MB)' },
        { status: 400 }
      )
    }

    // 이미지 MIME 타입 체크
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('achievements')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('achievements')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrlData.publicUrl })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return NextResponse.json({ error: error.message || '업로드 중 오류 발생' }, { status: 500 })
  }
}
