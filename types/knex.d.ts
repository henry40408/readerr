import Knex from 'knex'

declare module 'knex/types/tables' {
  interface User {
    userId: number
    username: string
    encryptedPassword: string
    createdAt: number
    updatedAt: number
  }
  interface Feed {
    feedId: number
    userId: number
    feedUrl: string
    link: string
    title: string
    createdAt: number
    updatedAt: number
    refreshedAt: number
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
    readAt?: number
    createdAt: number
    updatedAt: number
  }

  interface Tables {
    users: User
    users_composite: Knex.CompositeTableType<
      User,
      Pick<User, 'username', 'encryptedPassword', 'createdAt', 'updatedAt'>,
      Partial<Omit<User, 'userId'>>
    >
    feeds: Feed
    feeds_composite: Knex.CompositeTableType<
      Feed,
      Pick<
        Feed,
        'userId',
        'feedUrl',
        'link',
        'title',
        'createdAt',
        'updatedAt',
        'refreshedAt'
      >,
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
            'author',
            'readAt',
            'createdAt',
            'updatedAt'
          >
        >,
      Partial<Omit<Item, 'itemId'>>
    >
  }
}
