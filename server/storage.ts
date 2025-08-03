// Storage interface simplified - no persistence needed since history is removed
export interface IStorage {
  // No storage methods needed as we're not persisting analyses
}

export class MemoryStorage implements IStorage {
  // No methods needed for storage since we're not persisting data
}

export const storage = new MemoryStorage();
