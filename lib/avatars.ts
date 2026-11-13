import type { AvatarId } from "@/types";

export interface CatCoat {
  label: string;
  base: string;
  shade: string;
  stripe: string | null;
  belly: string;
  ear: string;
  eye: string;
  patch?: string; // calico second colour
}

export const COATS: Record<AvatarId, CatCoat> = {
  ginger: { label: "Ginger", base: "#E7A467", shade: "#C9844C", stripe: "#BF743D", belly: "#F8E6D2", ear: "#F0B2A2", eye: "#3D322B" },
  grey: { label: "Misty grey", base: "#ABA7A2", shade: "#8E8984", stripe: "#7B7671", belly: "#E7E3DE", ear: "#E7B3AA", eye: "#3D322B" },
  midnight: { label: "Midnight", base: "#4A403B", shade: "#372F2B", stripe: null, belly: "#5C514B", ear: "#9C7A72", eye: "#E8C66A" },
  calico: { label: "Calico", base: "#F3EADC", shade: "#DED2C1", stripe: null, belly: "#FBF6EE", ear: "#F0B2A2", eye: "#3D322B", patch: "#E39C5E" },
  cream: { label: "Cream", base: "#EED9B9", shade: "#D8BE98", stripe: "#D1B086", belly: "#FBF2E3", ear: "#F0B8A8", eye: "#3D322B" },
  snow: { label: "Snow", base: "#F7F3EE", shade: "#E0D8CE", stripe: null, belly: "#FFFFFF", ear: "#F2BFB4", eye: "#6F95B8" },
};

export const AVATAR_IDS = Object.keys(COATS) as AvatarId[];
