import type { NextPage } from 'next'
import Link from 'next/link'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Kazuru</title>
        <meta name="description" content="Kazuru - Anime Image Board" />
      </Head>
      <div id="content">
        <div id="sidebar">
          <div className="searchArea">
            <h2>Search</h2>
            <form action="/posts" method="get">
              <input type="text" name="tags" placeholder="Search tags..." />
              <button type="submit">Search</button>
            </form>
          </div>
          <div className="tagList">
            <h2>Tags</h2>
            {/* Tag list will go here */}
          </div>
        </div>
        <div id="post-list">
          {/* Posts will go here */}
        </div>
      </div>
    </>
  )
}

export default Home 