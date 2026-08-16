// ============================================================
// Lumina Backend — Supabase Database Access Service
// ============================================================

const getHeaders = () => {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };
};

export const dbService = {
  async select(table, queryParams = "") {
    const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (!supabaseUrl) {
      throw new Error("Supabase is not configured on the backend.");
    }
    
    const url = `${supabaseUrl}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    
    if (!res.ok) {
      throw new Error(`DB Select Error on table '${table}': ${await res.text()}`);
    }
    return res.json();
  },
  
  async upsert(table, data) {
    const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (!supabaseUrl) {
      throw new Error("Supabase is not configured on the backend.");
    }

    const url = `${supabaseUrl}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Prefer": "resolution=merge-duplicates" // PostgREST upsert merge conflict resolution
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      throw new Error(`DB Upsert Error on table '${table}': ${await res.text()}`);
    }
    return res.text();
  }
};
