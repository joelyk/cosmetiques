import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { env } from "@/lib/env";
import { createSupabaseReadClient } from "@/lib/supabase";
import type { StoreSettings } from "@/types/catalog";

type StoreSettingsSnapshot = {
  settings: StoreSettings;
  source: "env" | "supabase";
};

type StoreSettingsRow = {
  store_name: string;
  whatsapp_order_number: string;
  checkout_description: string;
  checkout_trust_note: string;
  whatsapp_button_label: string | null;
};

const normalizePhoneNumber = (value: string) => value.replace(/[^\d]/g, "");

const fallbackSettings: StoreSettings = {
  storeName: "Josy Cosmetics",
  whatsappOrderNumber: env.whatsappOrderNumber,
  checkoutDescription:
    "Le site prepare une demande claire vers le WhatsApp officiel de la boutique pour confirmer la commande, le mode de paiement et la livraison.",
  checkoutTrustNote:
    'Apres validation, vous serez redirige vers notre WhatsApp officiel pour confirmer votre commande et recevoir les instructions Mobile Money ou Orange Money.',
  whatsappButtonLabel: "Payer via WhatsApp",
};

const normalizeStoreSettings = (row: StoreSettingsRow): StoreSettings => ({
  storeName: row.store_name.trim() || fallbackSettings.storeName,
  whatsappOrderNumber:
    normalizePhoneNumber(row.whatsapp_order_number) ||
    fallbackSettings.whatsappOrderNumber,
  checkoutDescription:
    row.checkout_description.trim() || fallbackSettings.checkoutDescription,
  checkoutTrustNote:
    row.checkout_trust_note.trim() || fallbackSettings.checkoutTrustNote,
  whatsappButtonLabel:
    row.whatsapp_button_label?.trim() || fallbackSettings.whatsappButtonLabel,
});

export const getStoreSettings = async (): Promise<StoreSettingsSnapshot> => {
  noStore();

  const supabase = createSupabaseReadClient();
  if (!supabase) {
    return {
      settings: fallbackSettings,
      source: "env",
    };
  }

  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select(
        "store_name, whatsapp_order_number, checkout_description, checkout_trust_note, whatsapp_button_label",
      )
      .eq("id", "main")
      .maybeSingle();

    if (error || !data) {
      return {
        settings: fallbackSettings,
        source: "env",
      };
    }

    return {
      settings: normalizeStoreSettings(data as StoreSettingsRow),
      source: "supabase",
    };
  } catch {
    return {
      settings: fallbackSettings,
      source: "env",
    };
  }
};

