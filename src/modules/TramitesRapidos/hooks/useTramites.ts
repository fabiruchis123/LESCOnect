import { useState, useMemo } from 'react';
import { TRAMITES_CATEGORIES } from '../services/tramitesData';
import { TramiteCategory, TramiteSituation } from '../types';

export function useTramites(initialCategoryId?: string) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId || null
  );
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return (
      TRAMITES_CATEGORIES.find(
        (c) => c.id.toLowerCase() === selectedCategoryId.toLowerCase()
      ) || null
    );
  }, [selectedCategoryId]);

  const selectedSituation = useMemo(() => {
    if (!selectedCategory || !selectedSituationId) return null;
    return (
      selectedCategory.situations.find((s) => s.id === selectedSituationId) || null
    );
  }, [selectedCategory, selectedSituationId]);

  return {
    categories: TRAMITES_CATEGORIES,
    selectedCategory,
    selectedSituation,
    selectCategory: (cat: TramiteCategory | null) => {
      setSelectedCategoryId(cat ? cat.id : null);
      setSelectedSituationId(null);
    },
    selectSituation: (sit: TramiteSituation | null) => {
      setSelectedSituationId(sit ? sit.id : null);
    },
    resetToCategories: () => {
      setSelectedCategoryId(null);
      setSelectedSituationId(null);
    },
  };
}
