'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CourseFormProps {
  onSuccess?: () => void;
}

type LevelGroup = {
  level: string;
  departments: Array<{ id: string; department: string }>;
};

const LEVEL_ORDER = ['Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2'];

export function CourseForm({ onSuccess }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupedDepartments, setGroupedDepartments] = useState<LevelGroup[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('Level 200');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    schedule: [
      { day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00' },
    ],
  });

  type ScheduleEntry = {
    day_of_week: string;
    start_time: string;
    end_time: string;
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addScheduleEntry = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00' }],
    }));
  };

  const removeScheduleEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, idx) => idx !== index),
    }));
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await fetch('/api/admin/departments');
        if (!response.ok) throw new Error('Failed to load departments');

        const data = await response.json();
        setGroupedDepartments(data.groupedDepartments || []);

        const defaultGroup = (data.groupedDepartments || []).find(
          (group: LevelGroup) => group.level === selectedLevel && group.departments.length > 0
        ) || (data.groupedDepartments || [])[0];

        setSelectedLevel(defaultGroup?.level || 'Level 200');
        setSelectedClassId(defaultGroup?.departments?.[0]?.id || '');
      } catch (err) {
        console.error('[v0] Failed to fetch departments:', err);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const group = groupedDepartments.find((group) => group.level === selectedLevel);
    if (!group) return;

    const hasSelected = group.departments.some((item) => item.id === selectedClassId);
    if (!hasSelected) {
      setSelectedClassId(group.departments[0]?.id || '');
    }
  }, [groupedDepartments, selectedLevel, selectedClassId]);

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    const group = groupedDepartments.find((group) => group.level === value);
    setSelectedClassId(group?.departments[0]?.id || '');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const selectedGroup = groupedDepartments.find((group) => group.level === selectedLevel);
    const selectedDepartment = selectedGroup?.departments.find((item) => item.id === selectedClassId);

    if (!selectedDepartment) {
      setError('Please select a valid level and department');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          department: selectedDepartment.department,
          class_id: selectedDepartment.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create course');
      }

      setSuccess('Course created successfully');
      setFormData({
        name: '',
        code: '',
        schedule: [
          { day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00' },
        ],
      });
      setSelectedLevel('Level 200');
      setSelectedClassId(groupedDepartments[0]?.departments?.[0]?.id || '');

      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentDepartments = groupedDepartments.find((group) => group.level === selectedLevel)?.departments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Course</CardTitle>
        <CardDescription>Add a new course with schedule details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-600 bg-green-50 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Name</label>
              <Input
                type="text"
                placeholder="e.g., Data Structures"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Code</label>
              <Input
                type="text"
                placeholder="e.g., CS201"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={loading}
                required
                pattern="^[A-Z]{2,4}\d{3}$"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                disabled={loading || departmentsLoading}
              >
                {LEVEL_ORDER.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading || departmentsLoading || currentDepartments.length === 0}
                required
              >
                <option value="" disabled>
                  {departmentsLoading ? 'Loading departments…' : currentDepartments.length === 0 ? 'No departments available' : 'Select department'}
                </option>
                {currentDepartments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-medium">Class Schedule</label>
                <p className="text-sm text-slate-500">Add one or more weekly session times.</p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={addScheduleEntry} disabled={loading}>
                Add session
              </Button>
            </div>
            <div className="space-y-4">
              {formData.schedule.map((entry, index) => (
                <div key={index} className="rounded-2xl border border-input/50 bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2 w-full sm:w-1/3">
                      <label className="text-sm font-medium">Day</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={entry.day_of_week}
                        onChange={(e) => updateScheduleEntry(index, 'day_of_week', e.target.value)}
                        disabled={loading}
                      >
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                      </select>
                    </div>
                    <div className="space-y-2 w-full sm:w-1/3">
                      <label className="text-sm font-medium">Start Time</label>
                      <Input
                        type="time"
                        value={entry.start_time}
                        onChange={(e) => updateScheduleEntry(index, 'start_time', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2 w-full sm:w-1/3">
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={entry.end_time}
                        onChange={(e) => updateScheduleEntry(index, 'end_time', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  {formData.schedule.length > 1 && (
                    <div className="mt-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeScheduleEntry(index)}
                        disabled={loading}
                      >
                        Remove session
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || departmentsLoading || currentDepartments.length === 0}>
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
