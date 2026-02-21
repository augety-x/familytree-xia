'use client';

import { useState, useEffect, useCallback } from 'react';
import { FamilyData } from '../types/family';

export type DataSource = 'all' | 'sanfang';

const defaultFamilyData: FamilyData = {
  generations: []
};

export function useFamilyData(source: DataSource = 'all'): { 
  data: FamilyData; 
  loading: boolean; 
  error: string | null;
  refresh: () => void;
} {
  const [data, setData] = useState<FamilyData>(defaultFamilyData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/family-data?source=${source}`);
        
        if (!response.ok) {
          throw new Error(`API返回错误状态: ${response.status}`);
        }
        
        const fetchedData = await response.json();
        setData(fetchedData);
        setError(null);
      } catch (err) {
        console.error('获取家族数据失败:', err);
        setError('加载家族数据失败，使用默认数据');
        setData(defaultFamilyData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [source, refreshKey]);

  return { data, loading, error, refresh };
}

// 导出默认数据，以便在需要时使用
export const familyDataWithIds = defaultFamilyData; 