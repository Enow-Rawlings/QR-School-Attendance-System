'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClassFormProps {
  onSuccess?: () => void;
}

export function ClassForm({ onSuccess }: ClassFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    level: 'Level 200',
    department: '',
  });


  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: formData.level,
          department: formData.department,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create class');
      }

      setSuccess('Class created successfully');
      setFormData({
        level: 'Level 200',
        department: '',
      });

      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Class</CardTitle>
        <CardDescription>Add a new class with level and department</CardDescription>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value)}
                disabled={loading}
              >
                <option>Level 200</option>
                <option>Level 300</option>
                <option>Level 400</option>
                <option>Masters Year 1</option>
                <option>Masters Year 2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                disabled={loading}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Class'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
