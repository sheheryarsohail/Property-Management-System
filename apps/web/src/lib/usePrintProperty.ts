'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from './api';

export function splitAddressLines(addr?: string): [string, string] {
  if (!addr) return ['', ''];
  const clean = addr.trim();
  if (clean.length <= 38) return [clean, ''];

  const commaParts = clean.split(',');
  if (commaParts.length >= 2) {
    const mid = Math.ceil(commaParts.length / 2);
    return [
      commaParts.slice(0, mid).join(',').trim(),
      commaParts.slice(mid).join(',').trim()
    ];
  }

  const words = clean.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [
    words.slice(0, mid).join(' ').trim(),
    words.slice(mid).join(' ').trim()
  ];
}

export function usePrintProperty() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | undefined;

  const isBlank = rawId === 'blank';
  const isDirectId = !!rawId && rawId !== 'blank' && rawId !== 'sample';

  // 1. Direct property lookup if ID is provided
  const { data: directProperty, isLoading: isLoadingDirect, isError: isDirectError } = useQuery({
    queryKey: ['property-direct', rawId],
    queryFn: () => propertiesApi.get(rawId!),
    enabled: isDirectId,
    retry: 1,
  });

  // 2. Fallback query if direct lookup wasn't performed or wasn't found (e.g. plot code search)
  const needsList = !isDirectId || isDirectError || (!directProperty && !isLoadingDirect);
  const { data: rawList = [], isLoading: isLoadingList } = useQuery({
    queryKey: ['properties', 'fallback-print', rawId],
    queryFn: () => propertiesApi.list(rawId ? { search: rawId } : { assigned: true }),
    enabled: needsList,
  });

  const property = useMemo(() => {
    if (directProperty) return directProperty;
    if (rawList.length === 0) return null;

    if (rawId && rawId !== 'blank' && rawId !== 'sample') {
      const byCode = rawList.find(
        (p: any) => p.code?.toLowerCase() === rawId.toLowerCase()
      );
      if (byCode) return byCode;

      const byOwnership = rawList.find(
        (p: any) => p.ownerships?.some((o: any) => o.id === rawId)
      );
      if (byOwnership) return byOwnership;
    }

    return rawList[0] || null;
  }, [directProperty, rawList, rawId]);

  const activeOwnership =
    property?.ownerships?.find((o: any) => !o.endDate) || property?.ownerships?.[0];
  const customer = activeOwnership?.customer;

  // Gulshan-e-Fatima exclusivity guard
  const isOtherProject = property?.tenantId && property.tenantId !== 't_local';

  return {
    property,
    customer,
    activeOwnership,
    isBlank,
    isOtherProject,
    isLoading: isDirectId ? isLoadingDirect : isLoadingList,
    router,
  };
}
