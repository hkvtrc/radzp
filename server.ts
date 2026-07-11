import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// =========================================================================
// CONFIGURAÇÃO EDITÁVEL DA API KEY (PARADISE API)
// =========================================================================
const PARADISE_API_KEY_DEFAULT = "sk_f840faa7b0a9b50d903693270e6e3f5124da79bc801cac60ad26f7cfa1ade30f";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Routes

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 2. Create Transaction Proxy
  app.post("/api/create-transaction", async (req, res) => {
    try {
      const { name, email, phone, document } = req.body.customer || {};
      
      // Clean inputs
      const cleanPhone = (phone || "").replace(/[^\d]/g, "");

      // Generate a mathematically valid random CPF if document not provided or invalid
      let cleanDocument = (document || "").replace(/[^\d]/g, "");
      if (cleanDocument.length !== 11) {
        // CPF generator algorithm
        const num = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += num[i] * (10 - i);
        }
        let d1 = 11 - (sum % 11);
        if (d1 >= 10) d1 = 0;
        num.push(d1);

        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += num[i] * (11 - i);
        }
        let d2 = 11 - (sum % 11);
        if (d2 >= 10) d2 = 0;
        num.push(d2);
        
        cleanDocument = num.join("");
      }

      // Generate a valid-looking email if email not provided
      let cleanEmail = email;
      if (!cleanEmail || !cleanEmail.includes("@")) {
        const normalizedName = (name || "cliente").toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        cleanEmail = `${normalizedName || "cliente"}${Math.floor(Math.random() * 900) + 100}@gmail.com`;
      }

      const apiKey = process.env.PARADISE_API_KEY || PARADISE_API_KEY_DEFAULT;
      const isPlaceholder = !apiKey || apiKey === "sk_your_key_here" || apiKey.includes("your_key");

      if (isPlaceholder) {
        console.warn("⚠️ PARADISE_API_KEY is not defined or is a placeholder. Generating a fully interactive simulated payment for preview.");
        
        // Generate a high-quality mock response
        const mockTxId = Math.floor(Math.random() * 900000) + 100000;
        const mockRef = `ZR-MOCK-${Date.now()}`;
        const mockQrCode = "00020101021226830014br.gov.bcb.pix2561multi.paradisepags.com/api/v1/transaction/mock-pay-520400005303986540527.005802BR5925ZapRadar%20Acesso%20Premium6009Sao%20Paulo62070503***630489AB";
        
        // SVG representation of a qr code
        const svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'><rect width='256' height='256' fill='white'/><path d='M30 30h50v50H30zm10 10v30h30V40zm136-10h50v50h-50zm10 10v30h30V40zm-146 136h50v50H30zm10 10v30h30v-30zm136 0h50v50h-50zm10 10v30h30v-30zm-96-96h20v20h-20zm30 0h20v20h-20zm30 0h20v20h-20zm-60 30h20v20h-20zm60 0h20v20h-20zm-30 30h20v20h-20zm60 0h20v20h-20zm-30 30h20v20h-20zm-30-90h10v10H90zm0 30h10v10H90zm20 40h10v10h-10zM50 50h10v10H50zm126 0h10v10h-10zM50 176h10v10H50zm126 0h10v10h-10z' fill='#111e2e'/></svg>`;
        const base64Svg = "data:image/svg+xml;base64," + Buffer.from(svgString).toString("base64");

        return res.json({
          status: "success",
          mock: true,
          transaction_id: mockTxId,
          id: mockRef,
          qr_code: mockQrCode,
          qr_code_base64: base64Svg,
          amount: 1990,
          acquirer: "ParadiseBank",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          message: "API Key não configurada. Executando em modo de simulação."
        });
      }

      // Prepare official payload according to Paradise API documentation
      const reference = `ZR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        amount: 1990, // R$ 19,90 in cents
        description: "ZapRadar - Desbloquear Acesso Completo",
        reference: reference,
        offer_link: "https://www.test.com",
        customer: {
          name: name || "Cliente ZapRadar",
          email: cleanEmail,
          phone: cleanPhone || "11999999999",
          document: cleanDocument
        },
        source: "api_externa"
      };

      console.log(`Sending payload to Paradise API (Ref: ${reference})...`);

      const response = await fetch("https://multi.paradisepags.com/api/v1/transaction.php", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Paradise API Error Response:", errorText);
        return res.status(response.status).json({
          status: "error",
          message: "Erro retornado pela Paradise API de Pagamentos.",
          details: errorText
        });
      }

      const data = await response.json();
      return res.json(data);

    } catch (error: any) {
      console.error("Error creating transaction proxy:", error);
      return res.status(500).json({
        status: "error",
        message: "Ocorreu um erro interno ao processar a cobrança PIX.",
        error: error.message
      });
    }
  });

  // 3. Query Transaction Proxy
  app.get("/api/check-transaction/:id", async (req, res) => {
    try {
      const txId = req.params.id;
      const { mock } = req.query;

      const apiKey = process.env.PARADISE_API_KEY || PARADISE_API_KEY_DEFAULT;
      const isPlaceholder = !apiKey || apiKey === "sk_your_key_here" || apiKey.includes("your_key");

      if (mock === "true" || txId.startsWith("ZR-MOCK-") || isPlaceholder) {
        // Mock polling logic: approve automatically or return pending for simulating status check
        return res.json({
          id: txId,
          external_id: txId,
          status: "pending", // App handles simulation timer or manual confirmation in mock mode
          amount: 1990,
          amount_in_reais: "19,90"
        });
      }

      const response = await fetch(`https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${txId}`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Paradise Query Error:", errorText);
        return res.status(response.status).json({
          status: "error",
          message: "Erro ao consultar transação.",
          details: errorText
        });
      }

      const data = await response.json();
      return res.json(data);

    } catch (error: any) {
      console.error("Error checking transaction status:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao consultar status da transação.",
        error: error.message
      });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
