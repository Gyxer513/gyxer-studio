import type { GyxerProject, Entity, Field } from '@gyxer-studio/schema';
import { toKebabCase, toCamelCase, pluralize } from '../../utils.js';

// ─── Helpers ──────────────────────────────────────────────

function fieldToZodType(field: Field): string {
  switch (field.type) {
    case 'string':
    case 'text':
    case 'uuid':
      return field.required ? 'z.string().min(1)' : 'z.string().optional()';
    case 'int':
      return field.required ? 'z.coerce.number().int()' : 'z.coerce.number().int().optional()';
    case 'float':
      return field.required ? 'z.coerce.number()' : 'z.coerce.number().optional()';
    case 'boolean':
      return 'z.boolean().default(false)';
    case 'datetime':
      return field.required ? 'z.string().min(1)' : 'z.string().optional()';
    case 'enum':
      if (field.enumValues?.length) {
        const vals = field.enumValues.map((v) => `'${v}'`).join(', ');
        return `z.enum([${vals}])`;
      }
      return 'z.string()';
    case 'json':
      return field.required ? 'z.string().min(1)' : 'z.string().optional()';
    default:
      return 'z.string()';
  }
}

function fieldToInputJsx(field: Field): string {
  const label = field.name.charAt(0).toUpperCase() + field.name.slice(1);

  switch (field.type) {
    case 'text':
    case 'json':
      return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Textarea id="${field.name}" {...register('${field.name}')} placeholder="${label}" />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;

    case 'int':
    case 'float':
      return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Input id="${field.name}" type="number" {...register('${field.name}')} placeholder="${label}" />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;

    case 'boolean':
      return `          <div className="flex items-center gap-3">
            <Label htmlFor="${field.name}">${label}</Label>
            <Switch checked={!!watch('${field.name}')} onCheckedChange={(v) => setValue('${field.name}', v)} />
          </div>`;

    case 'datetime':
      return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Input id="${field.name}" type="datetime-local" {...register('${field.name}')} />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;

    case 'enum':
      if (field.enumValues?.length) {
        const options = field.enumValues
          .map((v) => `              <option value="${v}">${v}</option>`)
          .join('\n');
        return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Select id="${field.name}" {...register('${field.name}')}>
              <option value="">Select ${label}</option>
${options}
            </Select>
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;
      }
      return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Input id="${field.name}" {...register('${field.name}')} placeholder="${label}" />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;

    default:
      return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <Input id="${field.name}" {...register('${field.name}')} placeholder="${label}" />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;
  }
}

function columnRenderer(field: Field): string {
  switch (field.type) {
    case 'boolean':
      return `item.${field.name} ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>`;
    case 'datetime':
      return `item.${field.name} ? new Date(item.${field.name}).toLocaleDateString() : '—'`;
    case 'text':
      return `item.${field.name} ? String(item.${field.name}).slice(0, 50) + (String(item.${field.name}).length > 50 ? '...' : '') : '—'`;
    case 'json':
      return `'{...}'`;
    case 'enum':
      return `<Badge>{item.${field.name}}</Badge>`;
    default:
      return `item.${field.name} ?? '—'`;
  }
}

// ─── List Page ────────────────────────────────────────────

export function generateListPage(entity: Entity): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const columnHeaders = entity.fields
    .map((f) => `              <TableHead>${f.name}</TableHead>`)
    .join('\n');

  const columnCells = entity.fields
    .map((f) => `                <TableCell>{${columnRenderer(f)}}</TableCell>`)
    .join('\n');

  // Determine which imports are needed
  const needsBadge = entity.fields.some((f) => ['boolean', 'enum'].includes(f.type));

  return `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${camel}Service } from '../../services/${kebab}.service';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';${needsBadge ? `\nimport { Badge } from '../../components/ui/badge';` : ''}
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { GyxerSpinner } from '../../components/ui/gyxer-spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function ${plural}ListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ${camel}Service.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load ${plural.toLowerCase()}:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await ${camel}Service.remove(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">${plural}</h1>
        <Link to="/${pluralKebab}/create">
          <Button><Plus className="w-4 h-4 mr-2" /> Create</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><GyxerSpinner /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No ${plural.toLowerCase()} found. Create one to get started.
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
${columnHeaders}
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
${columnCells}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link to={\`/${pluralKebab}/\${item.id}/edit\`}>
                        <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this ${entity.name.toLowerCase()}? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
`;
}

// ─── Create Page ──────────────────────────────────────────

export function generateCreatePage(entity: Entity): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const zodFields = entity.fields
    .map((f) => `  ${f.name}: ${fieldToZodType(f)},`)
    .join('\n');

  const formInputs = entity.fields.map((f) => fieldToInputJsx(f)).join('\n');

  // Determine which UI components are needed
  const hasTextarea = entity.fields.some((f) => ['text', 'json'].includes(f.type));
  const hasSwitch = entity.fields.some((f) => f.type === 'boolean');
  const hasSelect = entity.fields.some((f) => f.type === 'enum' && f.enumValues?.length);

  return `import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ${camel}Service } from '../../services/${kebab}.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';${hasTextarea ? `\nimport { Textarea } from '../../components/ui/textarea';` : ''}${hasSelect ? `\nimport { Select } from '../../components/ui/select';` : ''}${hasSwitch ? `\nimport { Switch } from '../../components/ui/switch';` : ''}

const schema = z.object({
${zodFields}
});

type FormData = z.infer<typeof schema>;

export function ${plural}CreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,${hasSwitch ? '\n    watch,\n    setValue,' : ''}
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await ${camel}Service.create(data as Record<string, unknown>);
      navigate('/${pluralKebab}');
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create ${entity.name}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
${formInputs}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/${pluralKebab}')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
`;
}

// ─── Edit Page ────────────────────────────────────────────

export function generateEditPage(entity: Entity): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const zodFields = entity.fields
    .map((f) => `  ${f.name}: ${fieldToZodType(f)},`)
    .join('\n');

  const formInputs = entity.fields.map((f) => fieldToInputJsx(f)).join('\n');

  // Determine which UI components are needed
  const hasTextarea = entity.fields.some((f) => ['text', 'json'].includes(f.type));
  const hasSwitch = entity.fields.some((f) => f.type === 'boolean');
  const hasSelect = entity.fields.some((f) => f.type === 'enum' && f.enumValues?.length);

  return `import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ${camel}Service } from '../../services/${kebab}.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GyxerSpinner } from '../../components/ui/gyxer-spinner';${hasTextarea ? `\nimport { Textarea } from '../../components/ui/textarea';` : ''}${hasSelect ? `\nimport { Select } from '../../components/ui/select';` : ''}${hasSwitch ? `\nimport { Switch } from '../../components/ui/switch';` : ''}

const schema = z.object({
${zodFields}
});

type FormData = z.infer<typeof schema>;

export function ${plural}EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,${hasSwitch ? '\n    watch,\n    setValue,' : ''}
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!id) return;
    ${camel}Service.getById(id).then((data) => {
      reset(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load ${entity.name.toLowerCase()}:', err);
      setLoading(false);
    });
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await ${camel}Service.update(id, data as Record<string, unknown>);
      navigate('/${pluralKebab}');
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><GyxerSpinner /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit ${entity.name}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
${formInputs}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/${pluralKebab}')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
`;
}

// ─── Dashboard Page ───────────────────────────────────────

export function generateDashboardPage(project: GyxerProject): string {
  const title = project.name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const imports = project.entities
    .map((e) => {
      const kebab = toKebabCase(e.name);
      const camel = toCamelCase(e.name);
      return `import { ${camel}Service } from '../services/${kebab}.service';`;
    })
    .join('\n');

  const stateInits = project.entities
    .map((e) => {
      const camel = toCamelCase(e.name);
      return `    ${camel}: 0,`;
    })
    .join('\n');

  const loadCalls = project.entities
    .map((e) => {
      const camel = toCamelCase(e.name);
      return `      ${camel}Service.list().then((d) => setCounts((c) => ({ ...c, ${camel}: Array.isArray(d) ? d.length : 0 }))).catch(() => {}),`;
    })
    .join('\n');

  const entityCards = project.entities
    .map((e) => {
      const kebab = toKebabCase(e.name);
      const camel = toCamelCase(e.name);
      const plural = pluralize(e.name);
      const pluralKebab = pluralize(kebab);
      return `        <Link to="/${pluralKebab}" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">${plural}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary-600">{counts.${camel}}</p>
              <p className="text-sm text-gray-500 mt-1">total records</p>
            </CardContent>
          </Card>
        </Link>`;
    })
    .join('\n');

  return `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
${imports}

export function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>({
${stateInits}
  });

  useEffect(() => {
    Promise.all([
${loadCalls}
    ]);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome to ${title} admin panel</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
${entityCards}
      </div>
    </div>
  );
}
`;
}

// ─── Collect all page files ───────────────────────────────

export function generatePageFiles(project: GyxerProject): Map<string, string> {
  const files = new Map<string, string>();

  // Dashboard
  files.set('src/pages/dashboard.tsx', generateDashboardPage(project));

  // Entity pages
  for (const entity of project.entities) {
    const kebab = toKebabCase(entity.name);
    const pluralKebab = pluralize(kebab);
    files.set(`src/pages/${pluralKebab}/list.tsx`, generateListPage(entity));
    files.set(`src/pages/${pluralKebab}/create.tsx`, generateCreatePage(entity));
    files.set(`src/pages/${pluralKebab}/edit.tsx`, generateEditPage(entity));
  }

  return files;
}
