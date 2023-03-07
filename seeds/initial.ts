import { Knex } from 'knex'
import { newRepo } from '../src/knex/repository'

export async function seed(knex: Knex) {
  const repo = newRepo(knex)

  await knex('users').del()

  const [{ userId }] = await repo.createUser('user', 'password')
  const userRepo = repo.newUserRepo(userId)
  await Promise.all([
    userRepo.createFeed({
      feedUrl: 'https://www.reddit.com/.rss'
    }),
    userRepo.createFeed({
      feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
    }),
    userRepo.createFeed({
      feedUrl: 'https://github.com/miniflux/v2/releases.atom'
    })
  ])
}
