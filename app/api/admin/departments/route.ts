import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';

const LEVEL_ORDER = ['Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2'];

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ groupedDepartments: [] });
    }

    const { data: classes, error } = await supabaseServer
      .from('classes')
      .select('id, level, department')
      .not('department', 'is', null)
      .order('level', { ascending: true });

    if (error) throw error;

    const grouped = LEVEL_ORDER.map((level) => ({ level, departments: [] as Array<{ id: string; department: string }> }));
    const seen = new Set<string>();

    (classes || []).forEach((cls: any) => {
      const group = grouped.find((groupItem) => groupItem.level === cls.level);
      const key = `${cls.level}::${cls.department}`;
      if (group && cls.department && !seen.has(key)) {
        seen.add(key);
        group.departments.push({ id: cls.id, department: cls.department });
      }
    });

    return NextResponse.json({ groupedDepartments: grouped });
  } catch (error) {
    console.error('[v0] Get grouped departments error:', error);
    return NextResponse.json({ groupedDepartments: [] }, { status: 500 });
  }
}
