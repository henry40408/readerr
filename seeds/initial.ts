import { Knex } from 'knex'
import { createRepository } from '../knex/repository'

export async function seed(knex: Knex) {
  const repo = createRepository(knex)

  await knex('users').del()

  const [{ userId }] = await repo.createUser('user', 'password')
  const userRepo = repo.createUserRepository(userId)
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
