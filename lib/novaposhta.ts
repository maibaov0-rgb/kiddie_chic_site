const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

async function npRequest<T>(
  body: Record<string, unknown>,
): Promise<{ data: T; totalCount: number }> {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) throw new Error("NOVA_POSHTA_API_KEY is not set");

  const res = await fetch(NP_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ apiKey, ...body }),
    next:    { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Nova Poshta API error: ${res.status}`);

  const json = (await res.json()) as {
    success: boolean;
    data: T;
    info?: { totalCount?: number };
  };
  if (!json.success) throw new Error("Nova Poshta API returned success: false");
  return { data: json.data, totalCount: json.info?.totalCount ?? 0 };
}

export interface NpCity {
  Ref: string;
  Description: string;
  DescriptionRu: string;
  AreaDescription: string;
}

export interface NpBranch {
  Ref: string;
  Description: string;
  Number: string;
  CityRef: string;
}

export async function searchCities(query: string): Promise<NpCity[]> {
  const { data } = await npRequest<NpCity[]>({
    modelName:        "Address",
    calledMethod:     "getCities",
    methodProperties: { FindByString: query, Limit: "20" },
  });
  return data;
}

const PAGE_SIZE = 500;

export async function getBranches(cityRef: string): Promise<NpBranch[]> {
  const first = await npRequest<NpBranch[]>({
    modelName:        "AddressGeneral",
    calledMethod:     "getWarehouses",
    methodProperties: { CityRef: cityRef, Limit: String(PAGE_SIZE), Page: "1" },
  });

  const all = [...first.data];

  // Fetch remaining pages if there are more branches than PAGE_SIZE
  if (first.totalCount > PAGE_SIZE) {
    const totalPages = Math.ceil(first.totalCount / PAGE_SIZE);
    const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
      pages.map((page) =>
        npRequest<NpBranch[]>({
          modelName:        "AddressGeneral",
          calledMethod:     "getWarehouses",
          methodProperties: { CityRef: cityRef, Limit: String(PAGE_SIZE), Page: String(page) },
        }),
      ),
    );
    for (const r of rest) all.push(...r.data);
  }

  return all;
}
