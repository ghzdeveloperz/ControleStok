type WorkspaceAsset = "appLogo" | "profileImage";

const STORAGE_PREFIX = "mystoreday";

export const getWorkspaceAssetKey = (
  workspaceId: string,
  asset: WorkspaceAsset,
) => `${STORAGE_PREFIX}:${encodeURIComponent(workspaceId)}:${asset}`;

export const removeLegacyAssetKeys = () => {
  localStorage.removeItem("appLogo");
  localStorage.removeItem("profileImage");
};
