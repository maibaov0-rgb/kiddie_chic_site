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
    errors?: string[];
    info?: { totalCount?: number };
  };
  if (!json.success) {
    throw new Error(`Nova Poshta API error: ${JSON.stringify(json.errors)}`);
  }
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

export async function getBranches(cityRef: string): Promise<NpBranch[]> {
  const { data } = await npRequest<NpBranch[]>({
    modelName:        "AddressGeneral",
    calledMethod:     "getWarehouses",
    methodProperties: { CityRef: cityRef, Limit: "1000" },
  });
  return data;
}
