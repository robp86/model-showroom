// Central access to the generated model dataset + derived structures.

import { useMemo } from "react";
import { models as ALL_MODELS } from "../data/models.generated";
import { sortModels } from "../utils/modelFilters";
import { buildSeries, CATEGORIES } from "../data/categories";

export function useModels() {
  return useMemo(() => {
    const sorted = sortModels(ALL_MODELS, "best-match");
    const byId = new Map(sorted.map((m) => [m.id, m]));
    const series = buildSeries(sorted);
    const categoryCounts = {};
    for (const c of CATEGORIES) categoryCounts[c.id] = sorted.filter(c.match).length;
    return { models: sorted, byId, series, categoryCounts, total: sorted.length };
  }, []);
}

export function useModel(id) {
  const { byId } = useModels();
  return byId.get(id) || null;
}
