export type Locale = 'en' | 'ru';

export interface Translations {
  // Toolbar
  'toolbar.addEntity': string;
  'toolbar.exportJson': string;
  'toolbar.importJson': string;
  'toolbar.generate': string;
  'toolbar.language': string;

  // Sidebar — Project
  'sidebar.project': string;
  'sidebar.projectName': string;
  'sidebar.port': string;
  'sidebar.database': string;

  // Sidebar — Entity
  'sidebar.entity': string;
  'sidebar.entityName': string;
  'sidebar.fields': string;
  'sidebar.fieldPlaceholder': string;
  'sidebar.addField': string;
  'sidebar.selectEntity': string;
  'sidebar.selectElement': string;
  'sidebar.required': string;
  'sidebar.unique': string;
  'sidebar.index': string;
  'sidebar.defaultValue': string;
  'sidebar.enumValues': string;

  // Sidebar — Relation
  'sidebar.relation': string;
  'sidebar.relationType': string;
  'sidebar.relationOnDelete': string;
  'sidebar.relationForeignKey': string;
  'sidebar.deleteRelation': string;

  // Sidebar — Modules
  'sidebar.modules': string;
  'sidebar.authJwt': string;

  // Entity Node
  'node.addField': string;
  'node.remove': string;

  // Export
  'export.title': string;

  // Field types
  'type.string': string;
  'type.text': string;
  'type.int': string;
  'type.float': string;
  'type.boolean': string;
  'type.datetime': string;
  'type.enum': string;
  'type.json': string;
  'type.uuid': string;

  // Relation types
  'relation.oneToOne': string;
  'relation.oneToMany': string;
  'relation.manyToMany': string;

  // onDelete actions
  'onDelete.CASCADE': string;
  'onDelete.SET_NULL': string;
  'onDelete.RESTRICT': string;
  'onDelete.NO_ACTION': string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    'toolbar.addEntity': '+ Entity',
    'toolbar.exportJson': 'Export JSON',
    'toolbar.importJson': 'Import JSON',
    'toolbar.generate': '🚀 Generate',
    'toolbar.language': 'Language',

    'sidebar.project': 'Project',
    'sidebar.projectName': 'Name',
    'sidebar.port': 'Port',
    'sidebar.database': 'Database',

    'sidebar.entity': 'Entity',
    'sidebar.entityName': 'Name (PascalCase)',
    'sidebar.fields': 'Fields',
    'sidebar.fieldPlaceholder': 'field name',
    'sidebar.addField': '+ Add Field',
    'sidebar.selectEntity': 'Select an entity to edit',
    'sidebar.selectElement': 'Select an element to edit',
    'sidebar.required': 'req',
    'sidebar.unique': 'unique',
    'sidebar.index': 'index',
    'sidebar.defaultValue': 'Default',
    'sidebar.enumValues': 'Enum values (comma-separated)',

    'sidebar.relation': 'Relation',
    'sidebar.relationType': 'Type',
    'sidebar.relationOnDelete': 'On Delete',
    'sidebar.relationForeignKey': 'Foreign Key',
    'sidebar.deleteRelation': 'Delete Relation',

    'sidebar.modules': 'Modules',
    'sidebar.authJwt': 'JWT Auth',

    'node.addField': '+ add field',
    'node.remove': 'Remove entity',

    'export.title': 'Export',

    'type.string': 'string',
    'type.text': 'text',
    'type.int': 'int',
    'type.float': 'float',
    'type.boolean': 'boolean',
    'type.datetime': 'datetime',
    'type.enum': 'enum',
    'type.json': 'json',
    'type.uuid': 'uuid',

    'relation.oneToOne': '1 : 1',
    'relation.oneToMany': '1 : N',
    'relation.manyToMany': 'N : M',

    'onDelete.CASCADE': 'CASCADE',
    'onDelete.SET_NULL': 'SET NULL',
    'onDelete.RESTRICT': 'RESTRICT',
    'onDelete.NO_ACTION': 'NO ACTION',
  },

  ru: {
    'toolbar.addEntity': '+ Сущность',
    'toolbar.exportJson': 'Экспорт JSON',
    'toolbar.importJson': 'Импорт JSON',
    'toolbar.generate': '🚀 Сгенерировать',
    'toolbar.language': 'Язык',

    'sidebar.project': 'Проект',
    'sidebar.projectName': 'Название',
    'sidebar.port': 'Порт',
    'sidebar.database': 'База данных',

    'sidebar.entity': 'Сущность',
    'sidebar.entityName': 'Имя (PascalCase)',
    'sidebar.fields': 'Поля',
    'sidebar.fieldPlaceholder': 'имя поля',
    'sidebar.addField': '+ Добавить поле',
    'sidebar.selectEntity': 'Выберите сущность для редактирования',
    'sidebar.selectElement': 'Выберите элемент для редактирования',
    'sidebar.required': 'обяз',
    'sidebar.unique': 'уник',
    'sidebar.index': 'индекс',
    'sidebar.defaultValue': 'По умолчанию',
    'sidebar.enumValues': 'Значения enum (через запятую)',

    'sidebar.relation': 'Связь',
    'sidebar.relationType': 'Тип',
    'sidebar.relationOnDelete': 'При удалении',
    'sidebar.relationForeignKey': 'Внешний ключ',
    'sidebar.deleteRelation': 'Удалить связь',

    'sidebar.modules': 'Модули',
    'sidebar.authJwt': 'JWT Авторизация',

    'node.addField': '+ добавить поле',
    'node.remove': 'Удалить сущность',

    'export.title': 'Экспорт',

    'type.string': 'строка',
    'type.text': 'текст',
    'type.int': 'число',
    'type.float': 'дробь',
    'type.boolean': 'булево',
    'type.datetime': 'дата',
    'type.enum': 'перечисл.',
    'type.json': 'json',
    'type.uuid': 'uuid',

    'relation.oneToOne': '1 : 1',
    'relation.oneToMany': '1 : N',
    'relation.manyToMany': 'N : M',

    'onDelete.CASCADE': 'CASCADE',
    'onDelete.SET_NULL': 'SET NULL',
    'onDelete.RESTRICT': 'RESTRICT',
    'onDelete.NO_ACTION': 'NO ACTION',
  },
};
