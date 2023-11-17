import algoliasearch from 'algoliasearch/lite';
import { Hit as AlgoliaHit } from 'instantsearch.js';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import singletonRouter from 'next/router';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  DynamicWidgets,
  InstantSearch,
  Hits,
  Highlight,
  RefinementList,
  SearchBox,
  InstantSearchServerState,
  InstantSearchSSRProvider,
  getServerState,
  HierarchicalMenu,
} from 'react-instantsearch';
import { createInstantSearchRouterNext } from 'react-instantsearch-router-nextjs';
import { Panel } from '../components/Panel';

const client = algoliasearch('J7TKKA0SIS', '21c30f0956dacb0e525d274e073059be');
const indexName = 'product-index';

type HitProps = {
  hit: AlgoliaHit<{
    sku: string;
    brand: string;
    price: number;
  }>;
};

function Hit({ hit }: HitProps) {
  return (
    <>
      <Highlight hit={hit} attribute="sku" className="Hit-label" />
      <span className="Hit-sku">SKU: {hit.sku}</span>
      <span className="Hit-brand">Brand: {hit.brand}</span> |
      <span className="Hit-price">${hit.price}</span>
    </>
  );
}

type HomePageProps = {
  serverState?: InstantSearchServerState;
  url?: string;
};

export default function HomePage({ serverState, url }: HomePageProps) {
  return (
    <InstantSearchSSRProvider {...serverState}>
      <Head>
        <title>React InstantSearch - Next.js</title>
      </Head>

      <InstantSearch
        searchClient={client}
        indexName={indexName}
        future={{ preserveSharedStateOnUnmount: true }}
        routing={{
          router: createInstantSearchRouterNext({
            serverUrl: url,
            singletonRouter,
          }),
        }}
        insights={true}
      >
        <div className="Container">
          <div>
            <DynamicWidgets
              facets={[]}
              maxValuesPerFacet={10}
              fallbackComponent={FallbackComponent}
            >
              <HierarchicalMenu
                attributes={['hierarchical.lvl0', 'hierarchical.lvl1']}
              />
            </DynamicWidgets>
          </div>
          <div>
            <SearchBox />
            <Hits hitComponent={Hit} />
          </div>
        </div>
      </InstantSearch>
    </InstantSearchSSRProvider>
  );
}

function FallbackComponent({ attribute, ...other }: { attribute: string }) {
  return (
    <Panel header={attribute}>
      <RefinementList attribute={attribute} />
    </Panel>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> =
  async function getServerSideProps({ req }) {
    const protocol = req.headers.referer?.split('://')[0] || 'https';
    const url = `${protocol}://${req.headers.host}${req.url}`;
    const serverState = await getServerState(<HomePage url={url} />, {
      renderToString,
    });

    return {
      props: {
        serverState,
        url,
      },
    };
  };
