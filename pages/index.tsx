import algoliasearch from "algoliasearch/lite";
import { GetServerSideProps } from "next";
import Head from "next/head";
import singletonRouter from "next/router";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  InstantSearch,
  Hits,
  Highlight,
  RefinementList,
  SearchBox,
  InstantSearchServerState,
  InstantSearchSSRProvider,
  getServerState,
  useInstantSearch,
  useDynamicWidgets,
  HierarchicalMenu,
  Menu,
} from "react-instantsearch";
import { createInstantSearchRouterNext } from "react-instantsearch-router-nextjs";
import { Panel } from "../components/Panel";

const client = algoliasearch("J7TKKA0SIS", "21c30f0956dacb0e525d274e073059be");
const indexName = "product-index";
const hierarchicalAttributes = [
  "hierarchicalCategories.lvl0",
  "hierarchicalCategories.lvl1",
  "hierarchicalCategories.lvl2",
  "hierarchicalCategories.lvl3",
];

function isEmpty(str) {
  return !str || 0 === str.length;
}

function Hit({ hit }) {
  return (
    <>
      <Highlight hit={hit} attribute="sku" className="Hit-label" />
      <span className="Hit-sku">SKU: {hit.sku}</span>
      <span className="Hit-brand">Brand: {hit.Brand}</span> |
      <span className="Hit-price">${hit.price}</span>
    </>
  );
}

type HomePageProps = {
  serverState?: InstantSearchServerState;
  url?: string;
};

const Facets = () => {
  const [{ count, search }, setState] = React.useState({
    count: 10,
    search: "",
  });
  const instantSearchProps = useInstantSearch() as any;

  //useDynamicWidgets({ facets: ["*"] });

  useDynamicWidgets({
    facets: [],
    transformItems(_items, { results }) {
      return Object.keys(
        results._rawResults[0].facets?.applicable_facets ?? {}
      );
    },
  });

  const facets =
    instantSearchProps?.results?.renderingContent?.facetOrdering?.facets
      ?.order ?? [];

  const facetInfo =
    (instantSearchProps?.results._rawResults ?? [{}])[0]?.facets ?? {};

  var enabledFacets = [] as string[];
  var enabledFacetCount = 0;

  for (var i = 0; i < facets.length; i++) {
    if (enabledFacetCount < count) {
      const k = facets[i];
      if (
        facetInfo[k] &&
        Object.keys(facetInfo[k]).find((k2) => facetInfo[k][k2] > 0)
      ) {
        if (
          isEmpty(search) ||
          k?.toLowerCase()?.startsWith(search?.toLowerCase()) ||
          Object.keys(facetInfo[k]).find((k2) =>
            k2?.toLowerCase().startsWith(search?.toLowerCase())
          )
        ) {
          enabledFacets.push(k);
          enabledFacetCount++;
        }
      }
    } else {
      break;
    }
  }

  console.log({
    facets,
    facetInfoCount: Object.keys(facetInfo).length,
    enabledFacets,
  });

  const handleMore = () => setState((p) => ({ ...p, count: p.count + 10 }));
  const handleSearch = (e) => {
    setState((p) => ({ ...p, search: e?.target?.value }));
  };

  return (
    <>
      <input
        placeholder="Search Attributes"
        value={search}
        onChange={handleSearch}
      />
      <p></p>
      <Panel header="Applicable Facets">
        <Menu attribute={"applicable_facets"} />
      </Panel>

      <Panel header="Departments">
        <HierarchicalMenu
          attributes={hierarchicalAttributes}
          limit={20}
          showParentLevel={false}
        />
      </Panel>
      {enabledFacets.map((facet) => (
        <div key={facet}>
          <Panel header={facet}>
            <RefinementList attribute={facet} />
          </Panel>
        </div>
      ))}
      <button onClick={handleMore}>Show 10 More</button>
    </>
  );
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
            <Facets />
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

export const getServerSideProps: GetServerSideProps<HomePageProps> =
  async function getServerSideProps({ req }) {
    const protocol = req.headers.referer?.split("://")[0] || "https";
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
