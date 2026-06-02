'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import type { Course } from '@/lib/db';

interface CoursesListProps {
  refresh?: number;
}

export function CoursesList({ refresh }: CoursesListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/admin/courses');

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course? This action cannot be undone.')) return;

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete course');
      }

      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (course: Course) => {
    let toastHandle: ReturnType<typeof toast> | null = null;

    const onSave = async (updatedCourse: Omit<Course, 'created_at' | 'updated_at'>) => {
      try {
        const response = await fetch('/api/admin/courses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCourse),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update course');
        }

        fetchCourses();
        toastHandle?.dismiss();
      } catch (err) {
        toastHandle?.update({
          id: toastHandle.id,
          title: 'Update failed',
          description: <p className="text-sm text-destructive">{err instanceof Error ? err.message : 'An error occurred'}</p>,
          variant: 'destructive',
        });
      }
    };

    const description = (
      <CourseEditToastContent course={course} onSave={onSave} onCancel={() => toastHandle?.dismiss()} />
    );

    toastHandle = toast({
      title: 'Edit Course',
      description,
    });
  };

  function CourseEditToastContent({
    course,
    onSave,
    onCancel,
  }: {
    course: Course;
    onSave: (payload: Omit<Course, 'created_at' | 'updated_at'>) => Promise<void>;
    onCancel: () => void;
  }) {
    type ScheduleEntry = {
      day_of_week: string;
      start_time: string;
      end_time: string;
    };

    const initialSchedule = course.schedule && course.schedule.length > 0
      ? course.schedule
      : [{ day_of_week: course.day_of_week, start_time: course.start_time, end_time: course.end_time }];

    const [name, setName] = useState(course.name);
    const [code, setCode] = useState(course.code);
    const [department, setDepartment] = useState(course.department || '');
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
    const [saving, setSaving] = useState(false);

    const updateScheduleEntry = (index: number, field: keyof ScheduleEntry, value: string) => {
      setSchedule((prev) => prev.map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      ));
    };

    const addScheduleEntry = () => {
      setSchedule((prev) => [...prev, { day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00' }]);
    };

    const removeScheduleEntry = (index: number) => {
      setSchedule((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async () => {
      setSaving(true);
      const firstSchedule = schedule[0];
      await onSave({
        id: course.id,
        name,
        code,
        department,
        schedule,
        day_of_week: firstSchedule.day_of_week,
        start_time: firstSchedule.start_time,
        end_time: firstSchedule.end_time,
      });
      setSaving(false);
    };

    return (
      <div className="space-y-3 max-w-full">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Course name" />
          <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Course code" />
          <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" />
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Course schedule</p>
              <p className="text-sm text-slate-400">Edit one or more weekly sessions.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addScheduleEntry} disabled={saving}>
              Add session
            </Button>
          </div>
          <div className="space-y-3">
            {schedule.map((entry, index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-background p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <select
                  value={entry.day_of_week}
                  onChange={(event) => updateScheduleEntry(index, 'day_of_week', event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
                <Input
                  type="time"
                  value={entry.start_time}
                  onChange={(event) => updateScheduleEntry(index, 'start_time', event.target.value)}
                  disabled={saving}
                />
                <Input
                  type="time"
                  value={entry.end_time}
                  onChange={(event) => updateScheduleEntry(index, 'end_time', event.target.value)}
                  disabled={saving}
                />
                {schedule.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeScheduleEntry(index)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" onClick={onCancel} variant="secondary" size="sm">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} size="sm">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground">Loading courses...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses</CardTitle>
        <CardDescription>All registered courses with schedules</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {courses.length === 0 ? (
          <p className="text-muted-foreground">No courses yet. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Code</th>
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold">Department</th>
                  <th className="text-left py-2 px-2 font-semibold">Schedule</th>
                  <th className="text-left py-2 px-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{course.code}</td>
                    <td className="py-2 px-2">{course.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{course.department}</td>
                    <td className="py-2 px-2 text-muted-foreground">
                      {course.schedule && course.schedule.length > 0 ? (
                        course.schedule
                          .map((s) => `${s.day_of_week} ${s.start_time}-${s.end_time}`)
                          .join(', ')
                      ) : (
                        `${course.day_of_week} ${course.start_time}-${course.end_time}`
                      )}
                    </td>
                    <td className="py-2 px-2 text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(course)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
