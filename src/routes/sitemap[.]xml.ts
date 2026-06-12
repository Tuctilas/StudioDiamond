import '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'

import { CIDADES } from '#/lib/cidades'
import { getActiveSlugs } from '#/lib/queries'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin
        const slugs = await getActiveSlugs().catch(() => [] as string[])
        const urls = [
          `${origin}/`,
          `${origin}/acompanhantes`,
          ...CIDADES.map((c) => `${origin}/cidade/${c.slug}`),
          ...slugs.map((s) => `${origin}/acompanhantes/${s}`),
        ]
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
          `\n</urlset>`
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
