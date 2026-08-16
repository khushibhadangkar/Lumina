// ============================================================
// Lumina Backend — UN Comtrade API Integration Client
// ============================================================

export const comtradeClient = {
  async fetchTradeData({ period, cmdCode, flowCode }) {
    const apiKey = (process.env.COMTRADE_API_KEY || "").trim();
    let baseUrl;
    const headers = {};

    if (apiKey) {
      baseUrl = "https://comtradeapi.un.org/data/v1/get/C/A/HS";
      headers["Ocp-Apim-Subscription-Key"] = apiKey;
      headers["subscription-key"] = apiKey;
    } else {
      baseUrl = "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
    }

    const params = new URLSearchParams({
      reporterCode: 'all',
      partnerCode: 'all', // Get partner-level trade corridors
      period: period.toString(),
      cmdCode: cmdCode,
      flowCode: flowCode // 'M' for Imports, 'X' for Exports
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;

    // 15 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(fullUrl, {
        headers,
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
      return data.results || [];
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("UN Comtrade API request timed out (limit exceeded 15 seconds).");
      }
      throw err;
    }
  }
};
