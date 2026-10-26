'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { transfersApi, propertiesApi } from './api';

export interface TransferPrintData {
  transferId?: string;
  transferDate?: string;
  transferFee?: number | null;
  receiptCode?: string | null;

  // Seller
  sellerName?: string;
  sellerFatherHusband?: string;
  sellerCnic?: string;
  sellerPhone?: string;
  sellerAddress?: string;

  // Buyer / Allottee
  buyerName?: string;
  buyerFatherHusband?: string;
  buyerCnic?: string;
  buyerPhone?: string;
  buyerAddress?: string;

  // Nominee Details (for Buyer)
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeCnic?: string;
  nomineeAddress?: string;

  // Plot
  plotNo?: string;
  measuring?: string;
  category?: string;
  isCorner?: boolean;
  isWestOpen?: boolean;
  isParkFacing?: boolean;
  isRoadFacing?: boolean;
}

export function usePrintTransfer() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | undefined;

  const isBlank = rawId === 'blank';
  const isDirectId = !!rawId && rawId !== 'blank' && rawId !== 'sample';

  // 1. Try lookup as transfer ID
  const {
    data: directTransfer,
    isLoading: isLoadingTransfer,
    isError: isTransferError,
  } = useQuery({
    queryKey: ['transfer-print', rawId],
    queryFn: () => transfersApi.get(rawId!),
    enabled: isDirectId,
    retry: 0,
  });

  // 2. If transfer lookup fails, try property lookup (in case user passed property ID)
  const isPropertyFallback = isDirectId && isTransferError;
  const { data: directProperty, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property-transfer-fallback', rawId],
    queryFn: () => propertiesApi.get(rawId!),
    enabled: isPropertyFallback,
    retry: 0,
  });

  // Sample data directly from the official Transfer.xlsx template
  const sampleData: TransferPrintData = {
    transferId: 'TRF-SAMPLE',
    transferDate: new Date().toLocaleDateString('en-GB'),
    transferFee: 50000,
    receiptCode: 'REC-101',

    sellerName: 'Ismail Ghazi',
    sellerFatherHusband: 'Usman',
    sellerCnic: '42301-1470011-7',
    sellerPhone: '0310-2303034',
    sellerAddress: 'Flat no # 504 locality Bilal Arcade Garden West Karachi',

    buyerName: 'Ayaz',
    buyerFatherHusband: 'Pir Muhammad Khan',
    buyerCnic: '42101-1220111-1',
    buyerPhone: '0345-2929235',
    buyerAddress: 'H # D-713 Block R Usman Ghani Colony North Nazimabad Karachi',

    nomineeName: 'Sameer Khan',
    nomineeRelation: 'Brother',
    nomineeCnic: '42201-1234567-1',
    nomineeAddress: 'Freer Town Clifton Karachi',

    plotNo: 'L-378',
    measuring: '80',
    category: 'RESIDENTIAL',
    isCorner: false,
    isWestOpen: false,
    isParkFacing: false,
    isRoadFacing: false,
  };

  const resolvedData = useMemo<TransferPrintData | null>(() => {
    if (isBlank) return {};

    if (directTransfer) {
      const p = directTransfer.property || directTransfer.propertySnapshot || {};
      const from = directTransfer.from || directTransfer.previousOwnerSnapshot || {};
      const to = directTransfer.to || directTransfer.newOwnerSnapshot || {};

      return {
        transferId: directTransfer.id,
        transferDate: directTransfer.transferDate
          ? new Date(directTransfer.transferDate).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
        transferFee: directTransfer.transferFee ? Number(directTransfer.transferFee) : null,
        receiptCode: directTransfer.receipt?.code || null,

        sellerName: from.fullName || '',
        sellerFatherHusband: from.husbandName || from.fatherName || '',
        sellerCnic: from.nationalId || '',
        sellerPhone: from.mobile || from.phone || '',
        sellerAddress: from.address || '',

        buyerName: to.fullName || '',
        buyerFatherHusband: to.husbandName || to.fatherName || '',
        buyerCnic: to.nationalId || '',
        buyerPhone: to.mobile || to.phone || '',
        buyerAddress: to.address || '',

        nomineeName: to.nomineeName || '',
        nomineeRelation: to.nomineeRelation || '',
        nomineeCnic: to.nomineeNIC || to.nomineeCnic || '',
        nomineeAddress: to.nomineeAddress || '',

        plotNo: p.code || '',
        measuring: p.sizeSqYd ? String(p.sizeSqYd) : '',
        category: p.type ? String(p.type).toUpperCase() : 'RESIDENTIAL',
        isCorner: !!p.isCorner,
        isWestOpen: !!p.isWestOpen,
            isParkFacing: !!p.isParkingFacing,
        isRoadFacing: !!p.isRoadFacing,
      };
    }

    if (directProperty) {
      const p = directProperty;
      const ownerships = p.ownerships || [];
      const current = ownerships.find((o: any) => !o.endDate) || ownerships[0];
      const previous = ownerships.find((o: any) => o.endDate) || null;

      const from = previous?.customer || {};
      const to = current?.customer || {};

      return {
        transferId: p.id,
        transferDate: current?.startDate
          ? new Date(current.startDate).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
        transferFee: null,
        receiptCode: null,

        sellerName: from.fullName || '',
        sellerFatherHusband: from.husbandName || from.fatherName || '',
        sellerCnic: from.nationalId || '',
        sellerPhone: from.mobile || from.phone || '',
        sellerAddress: from.address || '',

        buyerName: to.fullName || '',
        buyerFatherHusband: to.husbandName || to.fatherName || '',
        buyerCnic: to.nationalId || '',
        buyerPhone: to.mobile || to.phone || '',
        buyerAddress: to.address || '',

        nomineeName: to.nomineeName || '',
        nomineeRelation: to.nomineeRelation || '',
        nomineeCnic: to.nomineeNIC || to.nomineeCnic || '',
        nomineeAddress: to.nomineeAddress || '',

        plotNo: p.code || '',
        measuring: p.sizeSqYd ? String(p.sizeSqYd) : '',
        category: p.type ? String(p.type).toUpperCase() : 'RESIDENTIAL',
        isCorner: !!p.isCorner,
        isWestOpen: !!p.isWestOpen,
            isParkFacing: !!p.isParkingFacing,
        isRoadFacing: !!p.isRoadFacing,
      };
    }

    return sampleData;
  }, [isBlank, directTransfer, directProperty]);

  const activeData: TransferPrintData = isBlank ? {} : (resolvedData || sampleData);
  const isLoading = isLoadingTransfer || (isPropertyFallback && isLoadingProperty);

  return {
    data: activeData,
    transfer: directTransfer,
    isBlank,
    isLoading,
    router,
  };
}
