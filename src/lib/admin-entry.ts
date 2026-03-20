const ADMIN_ENTRY_PATH = "/atelier-prive-josy-admin";

export const getAdminEntryPath = ({
  next,
  error,
}: {
  next?: string;
  error?: string;
} = {}) => {
  const params = new URLSearchParams();

  if (next?.startsWith("/")) {
    params.set("next", next);
  }

  if (error) {
    params.set("error", error);
  }

  const query = params.toString();

  return query ? `${ADMIN_ENTRY_PATH}?${query}` : ADMIN_ENTRY_PATH;
};

