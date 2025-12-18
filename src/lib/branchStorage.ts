// Branch-specific storage utilities
import { getFromStorage, setToStorage } from './storage';
import { Product } from '@/types';

export const getDataByBranch = <T extends { branchId?: string }>(
  storageKey: string,
  branchId: string | undefined
): T[] => {
  const allData = getFromStorage<T[]>(storageKey, []);
  if (!branchId) return allData;
  return allData.filter((item) => item.branchId === branchId);
};

export const saveDataWithBranch = <T extends { branchId?: string }>(
  storageKey: string,
  data: T,
  branchId: string | undefined
): void => {
  const allData = getFromStorage<T[]>(storageKey, []);
  const dataWithBranch = { ...data, branchId };
  allData.push(dataWithBranch);
  setToStorage(storageKey, allData);
};

export const updateDataWithBranch = <T extends { id: string; branchId?: string }>(
  storageKey: string,
  id: string,
  updatedData: Partial<T>,
  branchId: string | undefined
): void => {
  const allData = getFromStorage<T[]>(storageKey, []);
  const index = allData.findIndex((item) => item.id === id && item.branchId === branchId);
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updatedData };
    setToStorage(storageKey, allData);
  }
};

export const deleteDataWithBranch = <T extends { id: string; branchId?: string }>(
  storageKey: string,
  id: string,
  branchId: string | undefined
): void => {
  const allData = getFromStorage<T[]>(storageKey, []);
  const filteredData = allData.filter((item) => !(item.id === id && item.branchId === branchId));
  setToStorage(storageKey, filteredData);
};

export const getAllBranchesData = <T>(storageKey: string): T[] => {
  return getFromStorage<T[]>(storageKey, []);
};

export const copyProductsToBranch = (
  sourceBranchId: string,
  targetBranchId: string
): void => {
  const allProducts = getFromStorage<Product[]>('dimsum_products', []);
  const sourceProducts = allProducts.filter((p) => p.branchId === sourceBranchId);
  
  const copiedProducts = sourceProducts.map((product) => ({
    ...product,
    id: `${product.id}-${targetBranchId}-${Date.now()}`,
    branchId: targetBranchId,
    stock: 0, // Reset stock for new branch
  }));
  
  const updatedProducts = [...allProducts, ...copiedProducts];
  setToStorage('dimsum_products', updatedProducts);
};