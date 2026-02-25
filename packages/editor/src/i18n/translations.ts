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

  // Sidebar — Database
  'sidebar.dbHost': string;
  'sidebar.dbPort': string;
  'sidebar.dbUser': string;
  'sidebar.dbPassword': string;

  // Sidebar — Modules
  'sidebar.modules': string;
  'sidebar.authJwt': string;
  'sidebar.authInfo': string;
  'sidebar.authAddUser': string;
  'sidebar.authUserExists': string;

  // Entity Node
  'node.addField': string;
  'node.remove': string;

  // Export / Generate
  'export.title': string;
  'generate.configSaved': string;
  'generate.runCommand': string;
  'generate.noEntities': string;
  'generate.validationErrors': string;

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

  // Right Panel tabs
  'panel.schemaTab': string;
  'panel.httpTab': string;

  // HTTP Client
  'http.baseUrl': string;
  'http.send': string;
  'http.sending': string;
  'http.headers': string;
  'http.addHeader': string;
  'http.body': string;
  'http.response': string;
  'http.noResponse': string;
  'http.status': string;
  'http.time': string;
  'http.endpoint': string;
  'http.selectEndpoint': string;
  'http.noEntities': string;
  'http.history': string;
  'http.clearHistory': string;
  'http.noHistory': string;
  'http.corsError': string;
  'http.networkError': string;
  'http.create': string;
  'http.findAll': string;
  'http.findOne': string;
  'http.update': string;
  'http.remove': string;
  'http.register': string;
  'http.login': string;
  'http.refresh': string;
  'http.profile': string;
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

    'sidebar.dbHost': 'Host',
    'sidebar.dbPort': 'Port',
    'sidebar.dbUser': 'User',
    'sidebar.dbPassword': 'Password',

    'sidebar.modules': 'Modules',
    'sidebar.authJwt': 'JWT Auth',
    'sidebar.authInfo': 'User entity with email + password will be auto-generated. Add User to canvas to customize fields.',
    'sidebar.authAddUser': '+ Add User Entity',
    'sidebar.authUserExists': 'Using your custom User entity',

    'node.addField': '+ add field',
    'node.remove': 'Remove entity',

    'export.title': 'Export',
    'generate.configSaved': 'Config saved as {fileName}!',
    'generate.runCommand': 'Now generate your project:',
    'generate.noEntities': 'Add at least one entity!',
    'generate.validationErrors': 'Validation errors:',

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

    'panel.schemaTab': 'Schema',
    'panel.httpTab': 'HTTP',

    'http.baseUrl': 'Base URL',
    'http.send': 'Send',
    'http.sending': 'Sending...',
    'http.headers': 'Headers',
    'http.addHeader': '+ Add Header',
    'http.body': 'Body',
    'http.response': 'Response',
    'http.noResponse': 'Send a request to see the response',
    'http.status': 'Status',
    'http.time': 'Time',
    'http.endpoint': 'Endpoint',
    'http.selectEndpoint': 'Select an endpoint...',
    'http.noEntities': 'Add entities to see endpoints',
    'http.history': 'History',
    'http.clearHistory': 'Clear',
    'http.noHistory': 'No requests yet',
    'http.corsError': 'CORS error — ensure the server has CORS enabled',
    'http.networkError': 'Network error — is the server running?',
    'http.create': 'create',
    'http.findAll': 'list all',
    'http.findOne': 'get by id',
    'http.update': 'update',
    'http.remove': 'delete',
    'http.register': 'register',
    'http.login': 'login',
    'http.refresh': 'refresh token',
    'http.profile': 'get profile',
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

    'sidebar.dbHost': 'Хост',
    'sidebar.dbPort': 'Порт',
    'sidebar.dbUser': 'Пользователь',
    'sidebar.dbPassword': 'Пароль',

    'sidebar.modules': 'Модули',
    'sidebar.authJwt': 'JWT Авторизация',
    'sidebar.authInfo': 'Сущность User с email + password будет создана автоматически. Добавьте User на канву для кастомизации.',
    'sidebar.authAddUser': '+ Добавить User',
    'sidebar.authUserExists': 'Используется ваша сущность User',

    'node.addField': '+ добавить поле',
    'node.remove': 'Удалить сущность',

    'export.title': 'Экспорт',
    'generate.configSaved': 'Конфиг сохранён как {fileName}!',
    'generate.runCommand': 'Теперь сгенерируйте проект:',
    'generate.noEntities': 'Добавьте хотя бы одну сущность!',
    'generate.validationErrors': 'Ошибки валидации:',

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

    'panel.schemaTab': 'Схема',
    'panel.httpTab': 'HTTP',

    'http.baseUrl': 'Базовый URL',
    'http.send': 'Отправить',
    'http.sending': 'Отправка...',
    'http.headers': 'Заголовки',
    'http.addHeader': '+ Добавить заголовок',
    'http.body': 'Тело запроса',
    'http.response': 'Ответ',
    'http.noResponse': 'Отправьте запрос, чтобы увидеть ответ',
    'http.status': 'Статус',
    'http.time': 'Время',
    'http.endpoint': 'Эндпоинт',
    'http.selectEndpoint': 'Выберите эндпоинт...',
    'http.noEntities': 'Добавьте сущности для отображения эндпоинтов',
    'http.history': 'История',
    'http.clearHistory': 'Очистить',
    'http.noHistory': 'Запросов пока нет',
    'http.corsError': 'Ошибка CORS — убедитесь, что на сервере включен CORS',
    'http.networkError': 'Ошибка сети — сервер запущен?',
    'http.create': 'создать',
    'http.findAll': 'получить все',
    'http.findOne': 'получить по id',
    'http.update': 'обновить',
    'http.remove': 'удалить',
    'http.register': 'регистрация',
    'http.login': 'вход',
    'http.refresh': 'обновить токен',
    'http.profile': 'профиль',
  },
};
