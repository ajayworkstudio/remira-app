"use client";

import { useData } from "@/components/providers/data-provider";

export function useProfile() {
  const d = useData();
  const profile = d.data?.profile ?? null;
  const email = d.data?.email ?? profile?.email ?? null;
  const name = profile?.full_name?.trim() || email?.split("@")[0] || "there";
  return {
    profile,
    email,
    name,
    firstName: name.split(/\s+/)[0],
    preferences: profile?.preferences ?? {},
    loading: d.status === "loading",
    update: d.updateProfile,
    uploadAvatar: d.uploadAvatar,
  };
}
