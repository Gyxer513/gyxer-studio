import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Gyxer Studio',
  description: 'Visual backend builder that generates production-ready NestJS applications',

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'Gyxer Studio',

    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Guide', link: '/guide/visual-editor' },
      { text: 'Reference', link: '/reference/schema' },
      {
        text: 'GitHub',
        link: 'https://github.com/Gyxer513/gyxer-studio',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Gyxer?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Visual Editor', link: '/guide/visual-editor' },
          { text: 'Field Types', link: '/guide/field-types' },
          { text: 'Relations', link: '/guide/relations' },
          { text: 'Modules', link: '/guide/modules' },
          { text: 'HTTP Client', link: '/guide/http-client' },
          { text: 'Code Generation', link: '/guide/code-generation' },
          { text: 'CLI', link: '/guide/cli' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Schema Specification', link: '/reference/schema' },
          { text: 'Security Report', link: '/reference/security' },
          { text: 'Docker & Deployment', link: '/reference/docker' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Gyxer513/gyxer-studio' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present Gyxer',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/Gyxer513/gyxer-studio/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
