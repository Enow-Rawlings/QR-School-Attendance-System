'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User, Course, Class } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lecturerAssignments, setLecturerAssignments] = useState<any[]>([]);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, lecturersRes, classesRes, lecturerAssignRes, classAssignRes] = await Promise.all([
          fetch('/api/admin/courses'),
          fetch('/api/admin/lecturers'),
          fetch('/api/admin/classes'),
          fetch('/api/admin/assignments/lecturers'),
          fetch('/api/admin/assignments/classes'),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(data.courses || []);
        }
        if (lecturersRes.ok) {
          const data = await lecturersRes.json();
          setLecturers(data.lecturers || []);
        }
        if (classesRes.ok) {
          const data = await classesRes.json();
          setClasses(data.classes || []);
        }
        if (lecturerAssignRes.ok) {
          const data = await lecturerAssignRes.json();
          setLecturerAssignments(data.assignments || []);
        }
        if (classAssignRes.ok) {
          const data = await classAssignRes.json();
          setClassAssignments(data.assignments || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);

    try {
      const response = await fetch('/api/admin/assignments/lecturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourse,
          lecturer_id: selectedLecturer,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign lecturer');
      }

      setSelectedCourse('');
      setSelectedLecturer('');

      // Refresh assignments
      const res = await fetch('/api/admin/assignments/lecturers');
      if (res.ok) {
        const data = await res.json();
        setLecturerAssignments(data.assignments || []);
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);

    try {
      const response = await fetch('/api/admin/assignments/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourse,
          class_id: selectedClass,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign course to class');
      }

      setSelectedCourse('');
      setSelectedClass('');

      // Refresh assignments
      const res = await fetch('/api/admin/assignments/classes');
      if (res.ok) {
        const data = await res.json();
        setClassAssignments(data.assignments || []);
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteLecturerAssignment = async (id: string) => {
    if (!confirm('Remove this lecturer assignment?')) return;

    try {
      const response = await fetch('/api/admin/assignments/lecturers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove assignment');
      }

      const res = await fetch('/api/admin/assignments/lecturers');
      if (res.ok) {
        const data = await res.json();
        setLecturerAssignments(data.assignments || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteClassAssignment = async (id: string) => {
    if (!confirm('Remove this class assignment?')) return;

    try {
      const response = await fetch('/api/admin/assignments/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove assignment');
      }

      const res = await fetch('/api/admin/assignments/classes');
      if (res.ok) {
        const data = await res.json();
        setClassAssignments(data.assignments || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!user || user.role !== 'admin') {
    return <p className="text-red-600">Unauthorized</p>;
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Assignments</h1>
        <p className="text-muted-foreground mt-2">Assign lecturers to courses and courses to classes</p>
      </div>

      <Tabs defaultValue="lecturers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lecturers">Lecturer Assignments</TabsTrigger>
          <TabsTrigger value="classes">Class Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="lecturers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Lecturer to Course</CardTitle>
              <CardDescription>Select a course and lecturer to assign</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignLecturer} className="space-y-4">
                {assignError && (
                  <Alert variant="destructive">
                    <AlertDescription>{assignError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      disabled={assignLoading}
                      required
                    >
                      <option value="">Select a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lecturer</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedLecturer}
                      onChange={(e) => setSelectedLecturer(e.target.value)}
                      disabled={assignLoading}
                      required
                    >
                      <option value="">Select a lecturer...</option>
                      {lecturers.map((lecturer) => (
                        <option key={lecturer.id} value={lecturer.id}>
                          {lecturer.full_name} ({lecturer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={assignLoading}>
                  {assignLoading ? 'Assigning...' : 'Assign Lecturer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>{lecturerAssignments.length} lecturer assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {lecturerAssignments.length === 0 ? (
                <p className="text-muted-foreground">No assignments yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-semibold">Course</th>
                        <th className="text-left py-2 px-2 font-semibold">Lecturer</th>
                        <th className="text-left py-2 px-2 font-semibold">Schedule</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturerAssignments.map((assignment: any) => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-2 px-2">{assignment.courses?.code}</td>
                          <td className="py-2 px-2">{assignment.users?.full_name}</td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {assignment.courses?.day_of_week} {assignment.courses?.start_time} - {assignment.courses?.end_time}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLecturerAssignment(assignment.id)}
                            >
                              Remove
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
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Course to Class</CardTitle>
              <CardDescription>Select a course and class to assign</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignClass} className="space-y-4">
                {assignError && (
                  <Alert variant="destructive">
                    <AlertDescription>{assignError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      disabled={assignLoading}
                      required
                    >
                      <option value="">Select a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      disabled={assignLoading}
                      required
                    >
                      <option value="">Select a class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.level})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={assignLoading}>
                  {assignLoading ? 'Assigning...' : 'Assign Course to Class'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>{classAssignments.length} course-to-class assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {classAssignments.length === 0 ? (
                <p className="text-muted-foreground">No assignments yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-semibold">Course</th>
                        <th className="text-left py-2 px-2 font-semibold">Class</th>
                        <th className="text-left py-2 px-2 font-semibold">Level</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classAssignments.map((assignment: any) => (
                        <tr key={assignment.id} className="border-b">
                          <td className="py-2 px-2">{assignment.courses?.code}</td>
                          <td className="py-2 px-2">{assignment.classes?.name}</td>
                          <td className="py-2 px-2 text-muted-foreground">{assignment.classes?.level}</td>
                          <td className="py-2 px-2 text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClassAssignment(assignment.id)}
                            >
                              Remove
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
