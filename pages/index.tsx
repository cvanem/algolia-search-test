import algoliasearch from "algoliasearch/lite";
import { GetServerSideProps } from "next";
import Head from "next/head";
import singletonRouter from "next/router";
import React from "react";
import { renderToString } from "react-dom/server";
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
  useInstantSearch,
  useRefinementList,
  useDynamicWidgets,
} from "react-instantsearch";
import { createInstantSearchRouterNext } from "react-instantsearch-router-nextjs";
import { Panel } from "../components/Panel";

const client = algoliasearch("J7TKKA0SIS", "21c30f0956dacb0e525d274e073059be");
const indexName = "product-index";

export function sortAscendingToLower(a = "" as any, b = "" as any) {
  if ((a ?? "").toLowerCase() < (b ?? "").toLowerCase()) return -1;
  if ((a ?? "").toLowerCase() > (b ?? "").toLowerCase()) return 1;
  return 0;
}

export function sortDescendingToLower(a = "" as any, b = "" as any) {
  if ((a ?? "").toLowerCase() > (b ?? "").toLowerCase()) return -1;
  if ((a ?? "").toLowerCase() < (b ?? "").toLowerCase()) return 1;
  return 0;
}

export function isEmpty(str) {
  return !str || 0 === str.length;
}

function Hit({ hit }) {
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

const PanelWithRefinement = ({ facet }) => {
  const refinementListProps = useRefinementList({ attribute: facet });
  const { items = [] } = refinementListProps;
  const count = items?.length;

  return count > 0 ? (
    <Panel header={facet}>
      <RefinementList attribute={facet} />
    </Panel>
  ) : (
    <></>
  );
};

const Facets = () => {
  const [{ count, search }, setState] = React.useState({
    count: 10,
    search: "",
  });
  const instantSearchProps = useInstantSearch() as any;
  const dwProps = useDynamicWidgets({ facets: ["*"] });
  console.log({ instantSearchProps, dwProps });

  const facets =
    instantSearchProps?.results?.renderingContent?.facetOrdering?.facets
      ?.order ?? [];
  console.log({ facets });
  const facetInfo =
    (instantSearchProps?.results._rawResults ?? [{}])[0]?.facets ?? {};
  const enabledFacets = Object.keys(facetInfo)
    .filter((k) => Object.keys(facetInfo[k]).find((k2) => facetInfo[k][k2] > 0))
    .map((k) => k)
    .filter((f) =>
      isEmpty(search)
        ? true
        : f?.toLowerCase()?.startsWith(search?.toLowerCase())
    )
    .sort(sortAscendingToLower)
    .filter((facet, i) => i < count);

  console.log({ facetInfoCount: Object.keys(facetInfo).length, enabledFacets });

  /*const filtered = facets
    .sort(sortAscendingToLower)
    .filter((f) => {
      return isEmpty(search)
        ? true
        : f?.toLowerCase()?.startsWith(search?.toLowerCase());
    })
    .filter((f, i) => i < count);
    */
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
      {/*filtered.map((facet) => (
        <div key={facet}>
          <PanelWithRefinement facet={facet} />
        </div>
      ))*/}
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
            {/*
              <DynamicWidgets
                facets={["*"]}
                maxValuesPerFacet={10}
                fallbackComponent={DynamicFallbackComponent}
              >
                <HierarchicalMenu
                  attributes={["hierarchical.lvl0", "hierarchical.lvl1"]}
                />
              </DynamicWidgets>
      */}
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

function DynamicFallbackComponent({
  attribute,
  ...other
}: {
  attribute: string;
}) {
  /*const refinementListProps = useRefinementList({ attribute });
  const { items = [] } = refinementListProps;
  const count = items?.length;
  */
  const count = 0;
  const instantSearchProps = useInstantSearch() as any;
  const dwProps = useDynamicWidgets({ facets: [] });
  //console.log({ dwProps });

  //console.log({ attribute, other, count });

  return true ? (
    <></>
  ) : count > 0 ? (
    <Panel header={attribute}>
      <RefinementList attribute={attribute} />
    </Panel>
  ) : (
    <></>
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
