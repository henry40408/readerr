import fetch from 'node-fetch'
import { promises as fs } from 'fs'

async function atomFixture() {
  const minifluxAtom = 'https://github.com/miniflux/v2/releases.atom'
  const content = await fetch(minifluxAtom).then((r) => r.text())
  await fs.writeFile('fixtures/miniflux.atom', content)
}

async function rssFixture() {
  const nasaRss = 'https://www.nasa.gov/rss/dyn/breaking_news.rss'
  const content = await fetch(nasaRss).then((r) => r.text())
  await fs.writeFile('fixtures/nasa.rss', content)
}

async function main() {
  await rssFixture().catch((err) =>
    console.error('failed to download RSS fixture', err)
  )
  await atomFixture().catch((err) =>
    console.error('failed to download Atom fixture', err)
  )
}

main().catch(console.error)
