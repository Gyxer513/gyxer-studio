import type { GyxerProject, Entity, Field } from '@gyxer-studio/schema';
import { toKebabCase, toCamelCase, pluralize } from '../../utils.js';

// ─── FK Detection ────────────────────────────────────────

interface ForeignKeyInfo {
  fieldName: string;
  sourceEntity: string;
  sourceKebab: string;
  sourceCamel: string;
}

/**
 * Scan all entities to find inbound one-to-many / one-to-one relations
 * that point at `entity`. Returns FK fields that should appear in forms.
 */
function detectForeignKeys(entity: Entity, project: GyxerProject): ForeignKeyInfo[] {
  const fks: ForeignKeyInfo[] = [];
  for (const other of project.entities) {
    if (other.name === entity.name) continue;
    for (const rel of other.relations ?? []) {
      if (rel.target !== entity.name) continue;
      if (rel.type === 'one-to-many' || rel.type === 'one-to-one') {
        const fkName = rel.foreignKey || `${toCamelCase(other.name)}Id`;
        fks.push({
          fieldName: fkName,
          sourceEntity: other.name,
          sourceKebab: toKebabCase(other.name),
          sourceCamel: toCamelCase(other.name),
        });
      }
    }
  }
  return fks;
}

// ─── File Field Detection ────────────────────────────────

const FILE_PATTERNS = [
  /image/i, /avatar/i, /photo/i, /thumbnail/i, /cover/i,
  /banner/i, /logo/i, /icon/i, /file/i, /attachment/i,
  /document/i, /media/i,
];
const IMAGE_PATTERNS = [
  /image/i, /avatar/i, /photo/i, /thumbnail/i, /cover/i,
  /banner/i, /logo/i, /icon/i,
];

function isFileField(f: Field): boolean {
  return f.type === 'string' && FILE_PATTERNS.some((p) => p.test(f.name));
}

function isImageField(f: Field): boolean {
  return f.type === 'string' && IMAGE_PATTERNS.some((p) => p.test(f.name));
}

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

function fieldToInputJsx(field: Field, hasFileStorage: boolean): string {
  const label = field.name.charAt(0).toUpperCase() + field.name.slice(1);

  // File upload fields (when file-storage enabled)
  if (hasFileStorage && isFileField(field)) {
    const isImg = isImageField(field);
    return `          <div>
            <Label htmlFor="${field.name}">${label}</Label>
            <FileUpload
              value={watch('${field.name}') || ''}
              onChange={(v) => setValue('${field.name}', v)}${isImg ? `\n              accept="image/*"\n              previewType="image"` : ''}
            />
            {errors.${field.name} && <p className="text-sm text-red-500 mt-1">{errors.${field.name}?.message}</p>}
          </div>`;
  }

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

function fkToInputJsx(fk: ForeignKeyInfo): string {
  const label = fk.sourceEntity;
  return `          <div>
            <Label htmlFor="${fk.fieldName}">${label}</Label>
            <Select id="${fk.fieldName}" {...register('${fk.fieldName}')}>
              <option value="">Select ${label}</option>
              {${fk.sourceCamel}Options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name || opt.title || opt.email || opt.label || opt.slug || opt.id}
                </option>
              ))}
            </Select>
            {errors.${fk.fieldName} && <p className="text-sm text-red-500 mt-1">{errors.${fk.fieldName}?.message}</p>}
          </div>`;
}

function columnRenderer(field: Field, hasFileStorage: boolean): string {
  // Image preview in table
  if (hasFileStorage && isImageField(field)) {
    return `item.${field.name} ? <img src={\`/api/files/\${item.${field.name}}\`} alt="" className="h-10 w-10 rounded object-cover" /> : '—'`;
  }
  // File link in table
  if (hasFileStorage && isFileField(field)) {
    return `item.${field.name} ? <a href={\`/api/files/\${item.${field.name}}\`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">{String(item.${field.name}).slice(0, 20)}...</a> : '—'`;
  }

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

export function generateListPage(entity: Entity, project: GyxerProject): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const hasFileStorage = project.modules?.some(
    (m) => m.name === 'file-storage' && m.enabled !== false,
  ) ?? false;

  const fks = detectForeignKeys(entity, project);

  const columnHeaders = [
    ...entity.fields.map((f) => `              <TableHead>${f.name}</TableHead>`),
    ...fks.map((fk) => `              <TableHead>${fk.sourceEntity}</TableHead>`),
  ].join('\n');

  const columnCells = [
    ...entity.fields.map((f) => `                <TableCell>{${columnRenderer(f, hasFileStorage)}}</TableCell>`),
    ...fks.map((fk) => `                <TableCell>{${fk.sourceCamel}Map.get(item.${fk.fieldName})?.name || ${fk.sourceCamel}Map.get(item.${fk.fieldName})?.title || item.${fk.fieldName} || '—'}</TableCell>`),
  ].join('\n');

  // Determine which imports are needed
  const needsBadge = entity.fields.some((f) => ['boolean', 'enum'].includes(f.type));

  // FK service imports
  const fkServiceImports = fks
    .map((fk) => `import { ${fk.sourceCamel}Service } from '../../services/${fk.sourceKebab}.service';`)
    .join('\n');

  // FK state declarations
  const fkStateDecls = fks
    .map((fk) => `  const [${fk.sourceCamel}List, set${fk.sourceEntity}List] = useState<any[]>([]);`)
    .join('\n');

  // FK load calls
  const fkLoadCalls = fks
    .map((fk) => `    ${fk.sourceCamel}Service.list().then((d) => set${fk.sourceEntity}List(Array.isArray(d) ? d : [])).catch(() => {});`)
    .join('\n');

  // FK lookup maps
  const fkMaps = fks
    .map((fk) => `  const ${fk.sourceCamel}Map = new Map(${fk.sourceCamel}List.map((item) => [item.id, item]));`)
    .join('\n');

  return `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${camel}Service } from '../../services/${kebab}.service';${fkServiceImports ? '\n' + fkServiceImports : ''}
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';${needsBadge ? `\nimport { Badge } from '../../components/ui/badge';` : ''}
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { GyxerSpinner } from '../../components/ui/gyxer-spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function ${plural}ListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
${fkStateDecls ? '\n' + fkStateDecls : ''}

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

  useEffect(() => {
    load();${fkLoadCalls ? '\n' + fkLoadCalls : ''}
  }, []);

${fkMaps ? fkMaps + '\n' : ''}
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

export function generateCreatePage(entity: Entity, project: GyxerProject): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const hasFileStorage = project.modules?.some(
    (m) => m.name === 'file-storage' && m.enabled !== false,
  ) ?? false;

  const fks = detectForeignKeys(entity, project);

  const zodFields = [
    ...entity.fields.map((f) => `  ${f.name}: ${fieldToZodType(f)},`),
    ...fks.map((fk) => `  ${fk.fieldName}: z.coerce.number().int(),`),
  ].join('\n');

  const formInputs = entity.fields.map((f) => fieldToInputJsx(f, hasFileStorage)).join('\n');
  const fkInputs = fks.map((fk) => fkToInputJsx(fk)).join('\n');

  // Determine which UI components are needed
  const hasTextarea = entity.fields.some((f) => ['text', 'json'].includes(f.type));
  const hasSwitch = entity.fields.some((f) => f.type === 'boolean');
  const hasFileFields = hasFileStorage && entity.fields.some((f) => isFileField(f));
  const hasEnumSelect = entity.fields.some((f) => f.type === 'enum' && f.enumValues?.length);
  const needsSelect = hasEnumSelect || fks.length > 0;
  const needsWatchSetValue = hasSwitch || hasFileFields;

  // FK service imports
  const fkServiceImports = fks
    .map((fk) => `import { ${fk.sourceCamel}Service } from '../../services/${fk.sourceKebab}.service';`)
    .join('\n');

  // FK state + effect
  const fkStateDecls = fks
    .map((fk) => `  const [${fk.sourceCamel}Options, set${fk.sourceEntity}Options] = useState<any[]>([]);`)
    .join('\n');
  const fkLoadCalls = fks
    .map((fk) => `    ${fk.sourceCamel}Service.list().then((d) => set${fk.sourceEntity}Options(Array.isArray(d) ? d : [])).catch(() => {});`)
    .join('\n');

  return `import { ${fks.length > 0 ? 'useEffect, useState, ' : ''}} from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ${camel}Service } from '../../services/${kebab}.service';${fkServiceImports ? '\n' + fkServiceImports : ''}
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';${hasTextarea ? `\nimport { Textarea } from '../../components/ui/textarea';` : ''}${needsSelect ? `\nimport { Select } from '../../components/ui/select';` : ''}${hasSwitch ? `\nimport { Switch } from '../../components/ui/switch';` : ''}${hasFileFields ? `\nimport { FileUpload } from '../../components/ui/file-upload';` : ''}

const schema = z.object({
${zodFields}
});

type FormData = z.infer<typeof schema>;

export function ${plural}CreatePage() {
  const navigate = useNavigate();
${fkStateDecls ? '\n' + fkStateDecls + '\n' : ''}
  const {
    register,
    handleSubmit,${needsWatchSetValue ? '\n    watch,\n    setValue,' : ''}
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
${fks.length > 0 ? `
  useEffect(() => {
${fkLoadCalls}
  }, []);
` : ''}
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
${fkInputs}
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

export function generateEditPage(entity: Entity, project: GyxerProject): string {
  const kebab = toKebabCase(entity.name);
  const camel = toCamelCase(entity.name);
  const plural = pluralize(entity.name);
  const pluralKebab = pluralize(kebab);

  const hasFileStorage = project.modules?.some(
    (m) => m.name === 'file-storage' && m.enabled !== false,
  ) ?? false;

  const fks = detectForeignKeys(entity, project);

  const zodFields = [
    ...entity.fields.map((f) => `  ${f.name}: ${fieldToZodType(f)},`),
    ...fks.map((fk) => `  ${fk.fieldName}: z.coerce.number().int(),`),
  ].join('\n');

  const formInputs = entity.fields.map((f) => fieldToInputJsx(f, hasFileStorage)).join('\n');
  const fkInputs = fks.map((fk) => fkToInputJsx(fk)).join('\n');

  // Determine which UI components are needed
  const hasTextarea = entity.fields.some((f) => ['text', 'json'].includes(f.type));
  const hasSwitch = entity.fields.some((f) => f.type === 'boolean');
  const hasFileFields = hasFileStorage && entity.fields.some((f) => isFileField(f));
  const hasEnumSelect = entity.fields.some((f) => f.type === 'enum' && f.enumValues?.length);
  const needsSelect = hasEnumSelect || fks.length > 0;
  const needsWatchSetValue = hasSwitch || hasFileFields;

  // FK service imports
  const fkServiceImports = fks
    .map((fk) => `import { ${fk.sourceCamel}Service } from '../../services/${fk.sourceKebab}.service';`)
    .join('\n');

  // FK state + effect
  const fkStateDecls = fks
    .map((fk) => `  const [${fk.sourceCamel}Options, set${fk.sourceEntity}Options] = useState<any[]>([]);`)
    .join('\n');
  const fkLoadCalls = fks
    .map((fk) => `    ${fk.sourceCamel}Service.list().then((d) => set${fk.sourceEntity}Options(Array.isArray(d) ? d : [])).catch(() => {});`)
    .join('\n');

  return `import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ${camel}Service } from '../../services/${kebab}.service';${fkServiceImports ? '\n' + fkServiceImports : ''}
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GyxerSpinner } from '../../components/ui/gyxer-spinner';${hasTextarea ? `\nimport { Textarea } from '../../components/ui/textarea';` : ''}${needsSelect ? `\nimport { Select } from '../../components/ui/select';` : ''}${hasSwitch ? `\nimport { Switch } from '../../components/ui/switch';` : ''}${hasFileFields ? `\nimport { FileUpload } from '../../components/ui/file-upload';` : ''}

const schema = z.object({
${zodFields}
});

type FormData = z.infer<typeof schema>;

export function ${plural}EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
${fkStateDecls ? '\n' + fkStateDecls + '\n' : ''}
  const {
    register,
    handleSubmit,${needsWatchSetValue ? '\n    watch,\n    setValue,' : ''}
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
${fkLoadCalls ? fkLoadCalls + '\n' : ''}  }, [id, reset]);

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
${fkInputs}
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
    files.set(`src/pages/${pluralKebab}/list.tsx`, generateListPage(entity, project));
    files.set(`src/pages/${pluralKebab}/create.tsx`, generateCreatePage(entity, project));
    files.set(`src/pages/${pluralKebab}/edit.tsx`, generateEditPage(entity, project));
  }

  return files;
}
