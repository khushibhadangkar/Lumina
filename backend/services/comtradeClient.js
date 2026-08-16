// ============================================================
// Lumina Backend — UN Comtrade API Integration Client
// ============================================================

export const comtradeClient = {
  async fetchTradeData({ reporterCode, partnerCode, period, cmdCode, flowCode }) {
    const rawBaseUrl = (process.env.COMTRADE_BASE_URL || "").trim();
    const baseUrl = rawBaseUrl || "https://comtradeapi.un.org/public/v1";
    
    // Build parameters mapping
    const params = new URLSearchParams({
      reporterCode: reporterCode.toString(),
      partnerCode: partnerCode.toString(),
      period: period.toString(),
      cmdCode: cmdCode.toString(),
      flowCode: flowCode.toString()
    });

    const fullUrl = `${baseUrl}/preview/C/A/HS?${params.toString()}`;

    // 15 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(fullUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        throw new Error("UN Comtrade API rate limit exceeded (HTTP 429). Please try again later.");
      }

      if (!res.ok) {
        throw new Error(`UN Comtrade API request failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      return data.data || data.results || [];
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("UN Comtrade API request timed out (limit exceeded 15 seconds).");
      }
      throw err;
    }
  }
};
