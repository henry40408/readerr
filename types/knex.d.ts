import Knex from 'knex'

declare module 'knex/types/tables' {
  interface User {
    userId: number
    username: string
    encryptedPassword: string
  }
  interface Feed {
    feedId: number
    userId: number
    feedUrl: string
    link: string
    title: string
  }
  interface Item {
    itemId: number
    feedId: number
    title?: string
    link?: string
    content?: string
    pubDate?: Date
    author?: string
    guid?: string
  }

  interface Tables {
    users: User
    users_composite: Knex.CompositeTableType<
      User,
      Pick<User, 'username', 'encryptedPassword'>,
      Partial<Omit<User, 'userId'>>
    >
    feeds: Feed
    feeds_composite: Knex.CompositeTableType<
      User,
      Pick<Feed, 'userId', 'feedUrl', 'link', 'title'>,
      Partial<Omit<Feed, 'feedId'>>
    >
    items: Item
    items_composite: Knex.CompositeTableType<
      Item,
      Pick<Item, 'feedId', 'guid'> &
        Partial<Pick<Item, 'title', 'link', 'content', 'pubDate', 'author'>>,
      Partial<Omit<Item, 'itemid'>>
    >
  }
}
