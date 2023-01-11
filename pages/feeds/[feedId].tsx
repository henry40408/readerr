import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import { ItemComponent } from '../../components/Item'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

type ItemListProps = {
  feedId: number
  onRefresh: () => void
}

function ItemListComponent(props: ItemListProps) {
  const items = trpc.feed.items.useQuery(props.feedId)
  if (items.isLoading) return <Loading />
  return (
    <>
      {items.data?.items.map((item) => (
        <ItemComponent key={item.hash} item={item} />
      ))}
    </>
  )
}

export default function FeedPage(props: PageProps) {
  const items = trpc.feed.items.useQuery(props.feedId)
  const onRefresh = () => items.refetch()
  return (
    <>
      <Head>
        <title>{title(items.data?.feed?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {items.data?.feed?.feedId && (
        <>
          <FeedComponent
            noTitleLink
            feed={items.data.feed}
            onRefresh={onRefresh}
          />
          <ItemListComponent feedId={props.feedId} onRefresh={onRefresh} />
        </>
      )}
    </>
  )
}

type PageParams = {
  feedId: string
}

type PageProps = {
  feedId: number
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context: GetServerSidePropsContext
) => {
  const { feedId } = context.params as PageParams
  return {
    props: {
      feedId: Number(feedId)
    }
  }
}
