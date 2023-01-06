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
    contentSnippet?: string
    pubDate?: number
    author?: string
    hash: string
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
      Pick<Item, 'feedId', 'hash'> &
        Partial<
          Pick<
            Item,
            'title',
            'link',
            'content',
            'contentSnippet',
            'pubDate',
            'author'
          >
        >,
      Partial<Omit<Item, 'itemId'>>
    >
  }
}
