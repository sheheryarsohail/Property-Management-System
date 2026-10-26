import os

target_file = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/lib/usePrintCancellation.ts"

content = """'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cancellationsApi } from './api';

export interface CancellationPrintData {
  cancellationId?: string;
  cancellationDate?: string;
  reason?: string;
  notes?: string;

  // Plot details
  plotNo?: string;
  measuring?: string;
  category?: string;
  block?: string;

  // Cancelled previous customer details
  previousOwnerName?: string;
  previousOwnerFatherHusband?: string;
  previousOwnerCnic?: string;
  previousOwnerPhone?: string;
  previousOwnerAddress?: string;

  // Re-allotted new customer details
  isReallotted?: boolean;
  newAllotteeName?: string;
  newAllotteeFatherHusband?: string;
  newAllotteeCnic?: string;
  newAllotteePhone?: string;
  newAllotteeAddress?: string;
}

export function usePrintCancellation() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | undefined;

  const isBlank = rawId === 'blank';
  const isDirectId = !!rawId && rawId !== 'blank' && rawId !== 'sample';

  // Fetch cancellation data from API
  const {
    data: directCancellation,
    isLoading: isLoadingCancellation,
    isError: isCancellationError,
  } = useQuery({
    queryKey: ['cancellation-print', rawId],
    queryFn: () => cancellationsApi.get(rawId!),
    enabled: isDirectId,
    retry: 0,
  });

  // Official sample data matching the exact document template
  const sampleData: CancellationPrintData = {
    cancellationId: 'CAN-SAMPLE',
    cancellationDate: '28-08-2020',
    reason: 'non-payment of the required installments, despite multiple reminders',
    notes: 'Record maintenance note for re-allotment',

    plotNo: 'R-239',
    measuring: '120',
    category: 'RESIDENTIAL',
    block: 'Block A',

    previousOwnerName: 'ILYAS',
    previousOwnerFatherHusband: 'Abdul Latif',
    previousOwnerCnic: '42000-0555137-5',
    previousOwnerPhone: '0332-27339670',
    previousOwnerAddress: 'House # 144/3 Memon Colony F.B Area Karachi',

    isReallotted: true,
    newAllotteeName: 'MUHAMMAD SHAKEEL',
    newAllotteeFatherHusband: 'USMAN IBRAHIM',
    newAllotteeCnic: '42201-3477840-9',
    newAllotteePhone: '0300-2245534',
    newAllotteeAddress: 'PLOT NO C-24 AL HILAL SOCIETY MAIN UNIVERSITY ROAD KARACHI',
  };

  const resolvedData = useMemo<CancellationPrintData | null>(() => {
    if (isBlank) return {};

    if (directCancellation) {
      const c = directCancellation;
      const prop = c.property || {};
      const prevCustomer = c.customer || {};
      const nextCustomer = c.newAllottee || null;

      // Format date like 28-08-2020 (en-GB format DD-MM-YYYY)
      let formattedDate = '';
      if (c.cancelledAt) {
        const d = new Date(c.cancelledAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
      } else {
        formattedDate = new Date().toLocaleDateString('en-GB').replace(/\\//g, '-');
      }

      const defaultReason = 'non-payment of the required installments, despite multiple reminders';
      const reasonText = (c.reason && c.reason.trim() !== 'Plot Cancellation & Refund') 
        ? c.reason 
        : defaultReason;

      return {
        cancellationId: c.id,
        cancellationDate: formattedDate,
        reason: reasonText,
        notes: c.notes || '',

        plotNo: prop.code || '',
        measuring: prop.sizeSqYd ? String(prop.sizeSqYd) : '',
        category: prop.type ? String(prop.type).toUpperCase() : 'RESIDENTIAL',
        block: prop.block || '',

        previousOwnerName: prevCustomer.fullName ? prevCustomer.fullName.trim() : '',
        previousOwnerFatherHusband: prevCustomer.fatherName || prevCustomer.husbandName || prevCustomer.relationName || '',
        previousOwnerCnic: prevCustomer.nationalId || '',
        previousOwnerPhone: prevCustomer.phone || prevCustomer.mobile || '',
        previousOwnerAddress: prevCustomer.address || '',

        isReallotted: !!nextCustomer,
        newAllotteeName: nextCustomer?.fullName ? nextCustomer.fullName.trim() : '',
        newAllotteeFatherHusband: nextCustomer?.fatherName || nextCustomer?.husbandName || nextCustomer?.relationName || '',
        newAllotteeCnic: nextCustomer?.nationalId || '',
        newAllotteePhone: nextCustomer?.phone || nextCustomer?.mobile || '',
        newAllotteeAddress: nextCustomer?.address || '',
      };
    }

    return sampleData;
  }, [isBlank, directCancellation]);

  const activeData: CancellationPrintData = isBlank ? {} : (resolvedData || sampleData);
  const isLoading = isLoadingCancellation;

  return {
    data: activeData,
    cancellation: directCancellation,
    isBlank,
    isLoading,
    router,
  };
}
"""

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"SUCCESS: Created {target_file}")
