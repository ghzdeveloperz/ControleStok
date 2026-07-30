import { adjustStock } from "../callables";

export interface StockMovementInput {
  productId: string;
  quantity: number;
  cost?: number;
  unitPrice?: number;
  type: "add" | "remove";
  date: string;
}

const assertWorkspaceId = (workspaceId: string) => {
  if (
    typeof workspaceId !== "string" ||
    workspaceId.trim().length === 0 ||
    workspaceId.length > 128 ||
    workspaceId.includes("/")
  ) {
    throw new Error("Workspace inválido.");
  }
};

export const adjustStockForUser = async (
  workspaceId: string,
  movement: StockMovementInput,
) => {
  assertWorkspaceId(workspaceId);
  return adjustStock(movement);
};
