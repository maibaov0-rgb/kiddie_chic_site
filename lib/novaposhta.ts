const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

async function npRequest<T>(body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) throw new Error("NOVA_POSHTA_API_KEY is not set");

  const res = await fetch(NP_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ apiKey, ...body }),
    next:    { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Nova Poshta API error: ${res.status}`);

  const json = (await res.json()) as { success: boolean; data: T };
  if (!json.success) throw new Error("Nova Poshta API returned success: false");
  return json.data;
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
  return npRequest<NpCity[]>({
    modelName:        "Address",
    calledMethod:     "getCities",
    methodProperties: { FindByString: query, Limit: "20" },
  });
}

export async function getBranches(cityRef: string): Promise<NpBranch[]> {
  return npRequest<NpBranch[]>({
    modelName:        "AddressGeneral",
    calledMethod:     "getWarehouses",
    methodProperties: { CityRef: cityRef, Limit: "100" },
  });
}
