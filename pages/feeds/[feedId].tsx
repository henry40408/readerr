import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import { ItemComponent } from '../../components/Item'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { useFetchItems } from '../../components/hooks'
import { useRouter } from 'next/router'

function ItemListComponent() {
  const router = useRouter()
  const feedId = router.query.feedId as string
  const { data, isLoading } = useFetchItems(feedId)
  if (isLoading) return <Loading />
  return (
    <>
      {data?.items?.map((item) => (
        <ItemComponent key={item.hash} item={item} />
      ))}
    </>
  )
}

export default function FeedPage(props: PageProps) {
  const { data, mutate } = useFetchItems(props.feedId)
  return (
    <>
      <Head>
        <title>{title(data?.feed?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {data?.feed?.feedId && (
        <>
          <FeedComponent noTitleLink feed={data.feed} mutate={mutate} />
          <ItemListComponent />
        </>
      )}
    </>
  )
}

type PageParams = {
  feedId: string
}

type PageProps = {
  feedId: string
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context: GetServerSidePropsContext
) => {
  const { feedId } = context.params as PageParams
  return {
    props: {
      feedId
    }
  }
}
