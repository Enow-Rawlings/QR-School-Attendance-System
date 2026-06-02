'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import type { Class } from '@/lib/db';

interface ClassesListProps {
  refresh?: number;
}

export function ClassesList({ refresh }: ClassesListProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/admin/classes');

      if (!response.ok) throw new Error('Failed to fetch classes');

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class? This action cannot be undone.')) return;

    try {
      const response = await fetch('/api/admin/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete class');
      }

      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (cls: Class) => {
    let toastHandle: ReturnType<typeof toast> | null = null;

    const onSave = async (updatedClass: Omit<Class, 'created_at' | 'updated_at'>) => {
      try {
        const response = await fetch('/api/admin/classes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedClass),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update class');
        }

        fetchClasses();
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
      <ClassEditToastContent cls={cls} onSave={onSave} onCancel={() => toastHandle?.dismiss()} />
    );

    toastHandle = toast({
      title: 'Edit Class',
      description,
    });
  };

  function ClassEditToastContent({
    cls,
    onSave,
    onCancel,
  }: {
    cls: Class;
    onSave: (payload: Omit<Class, 'created_at' | 'updated_at'>) => Promise<void>;
    onCancel: () => void;
  }) {
    const [level, setLevel] = useState(cls.level);
    const [department, setDepartment] = useState(cls.department || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
      setSaving(true);
      await onSave({
        id: cls.id,
        name: `${level} ${department}`,
        level,
        department,
      });
      setSaving(false);
    };

    return (
      <div className="space-y-3 max-w-full">
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 sm:text-sm"
          >
            <option value="Level 200">Level 200</option>
            <option value="Level 300">Level 300</option>
            <option value="Level 400">Level 400</option>
            <option value="Masters Year 1">Masters Year 1</option>
            <option value="Masters Year 2">Masters Year 2</option>
          </select>
          <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" />
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
          <p className="text-muted-foreground">Loading classes...</p>
        </CardContent>
      </Card>
    );
  }

  const LEVEL_ORDER = ['Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2'];
  const groupedClasses = LEVEL_ORDER.map((level) => ({
    level,
    items: classes.filter((cls) => cls.level === level),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes</CardTitle>
        <CardDescription>All registered classes by academic level</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {classes.length === 0 ? (
          <p className="text-muted-foreground">No classes yet. Create one to get started.</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {groupedClasses.map((group) => (
              <AccordionItem key={group.level} value={group.level}>
                <AccordionTrigger className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{group.level}</h3>
                    <p className="text-sm text-slate-400">{group.items.length} department{group.items.length === 1 ? '' : 's'}</p>
                  </div>
                  {group.items.length > 0 && (
                    <div className="text-sm text-slate-300">Last created: {new Date(group.items[0].created_at).toLocaleDateString()}</div>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {group.items.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-400">No departments registered for this level yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {group.items.map((cls) => (
                        <div key={cls.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 md:grid-cols-[1fr_auto] md:items-center">
                          <div>
                            <p className="font-medium text-white">{cls.department}</p>
                            <p className="text-sm text-slate-400">{cls.name}</p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(cls)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(cls.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
