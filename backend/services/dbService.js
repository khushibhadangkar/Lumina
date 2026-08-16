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
    try {
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      return await res.json();
    } catch (err) {
      let diagnosticMsg = `Supabase request failed querying table '${table}'.`;
      if (err.cause) {
        diagnosticMsg += ` Cause: ${err.cause.message || err.cause}`;
      } else {
        diagnosticMsg += ` Message: ${err.message}`;
      }
      throw new Error(diagnosticMsg);
    }
  },
  
  async upsert(table, data) {
    const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (!supabaseUrl) {
      throw new Error("Supabase is not configured on the backend.");
    }

    const url = `${supabaseUrl}/rest/v1/${table}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...getHeaders(),
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      return await res.text();
    } catch (err) {
      let diagnosticMsg = `Supabase request failed writing to table '${table}'.`;
      if (err.cause) {
        diagnosticMsg += ` Cause: ${err.cause.message || err.cause}`;
      } else {
        diagnosticMsg += ` Message: ${err.message}`;
      }
      throw new Error(diagnosticMsg);
    }
  }
};
