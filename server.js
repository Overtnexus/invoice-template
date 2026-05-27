require("dotenv").config(); // 🔥 MUST BE FIRST

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// ==========================================
// ENV VARIABLES
// ==========================================

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const ACCOUNTS_URL = "https://accounts.zoho.in";
const API_URL = "https://www.zohoapis.in";


// ==========================================
// DEBUG ENV CHECK (IMPORTANT)
// ==========================================

console.log("==================================");
console.log("🔐 ENV STATUS CHECK");
console.log("CLIENT_ID:", CLIENT_ID ? "LOADED" : "MISSING");
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "LOADED" : "MISSING");
console.log("REFRESH_TOKEN:", REFRESH_TOKEN ? "LOADED" : "MISSING");
console.log("==================================");


// ==========================================
// GET ACCESS TOKEN (AUTO REFRESH)
// ==========================================

async function getAccessToken() {
    try {
        const response = await axios.post(
            `${ACCOUNTS_URL}/oauth/v2/token`,
            null,
            {
                params: {
                    refresh_token: REFRESH_TOKEN,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: "refresh_token"
                }
            }
        );

        console.log("✔ New Access Token Generated");

        return response.data.access_token;

    } catch (error) {
        console.log("❌ TOKEN ERROR:");
        console.log(error.response?.data || error.message);
        throw error;
    }
}


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ==========================================
// INVOICE API
// ==========================================
// ==========================================
// INVOICE API WITH E-INVOICE
// ==========================================

app.get("/invoice/:invoiceId/:orgId", async (req, res) => {

    try {

        const { invoiceId, orgId } = req.params;

        console.log("==================================");
        console.log("INVOICE REQUEST");
        console.log("Invoice ID:", invoiceId);
        console.log("Org ID:", orgId);

        // ======================================
        // ACCESS TOKEN
        // ======================================

        const token = await getAccessToken();

        // ======================================
        // NORMAL INVOICE
        // ======================================

        const invoiceResponse = await axios.get(
            `${API_URL}/books/v3/invoices/${invoiceId}`,
            {
                headers: {
                    Authorization:
                        `Zoho-oauthtoken ${token}`
                },
                params: {
                    organization_id: orgId
                }
            }
        );

        const invoice =
            invoiceResponse.data.invoice;

        console.log("✔ Invoice Loaded");

        // ======================================
        // E-INVOICE DETAILS
        // ======================================

        try {

            const einvoiceResponse =
                await axios.get(
                    `${API_URL}/books/v3/invoices/${invoiceId}/einvoice`,
                    {
                        headers: {
                            Authorization:
                                `Zoho-oauthtoken ${token}`
                        },
                        params: {
                            organization_id: orgId
                        }
                    }
                );

            console.log("✔ E-INVOICE LOADED");

            console.log(
                JSON.stringify(
                    einvoiceResponse.data,
                    null,
                    2
                )
            );

            invoice.einvoice =
                einvoiceResponse.data.einvoice;

        } catch (einvoiceError) {

            console.log(
                "❌ E-INVOICE NOT FOUND"
            );

            invoice.einvoice = null;
        }

        // ======================================
        // RETURN FINAL
        // ======================================

        return res.json(invoice);

    } catch (error) {

        console.log("❌ INVOICE FETCH FAILED");

        console.log(
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Invoice Fetch Failed",
            error:
                error.response?.data ||
                error.message
        });
    }
});

// app.get("/invoice/:invoiceId/:orgId", async (req, res) => {
//     try {

//         const { invoiceId, orgId } = req.params;
//         console.log("==================================");
//         console.log("INVOICE REQUEST");
//         console.log("Invoice ID:", invoiceId);
//         console.log("Org ID:", orgId);

//         if (!invoiceId || !orgId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing invoiceId or orgId"
//             });
//         }

//         // STEP 1: GET ACCESS TOKEN
//         const token = await getAccessToken();

//         // STEP 2: CALL ZOHO API
//         const url = `${API_URL}/books/v3/invoices/${invoiceId}`;

//         const response = await axios.get(url, {
//             headers: {
//                 Authorization: `Zoho-oauthtoken ${token}`
//             },
//             params: {
//                 organization_id: orgId
//             }
//         });

//         console.log("✔ INVOICE FETCH SUCCESS");

//         // return res.json(response.data);
//         const invoiceData = response.data.invoice;

// // DEBUG

// console.log("IRN:", invoiceData.irn);
// console.log("QR:", invoiceData.qr_code_url);

// return res.json(invoiceData);

//     } catch (error) {

//         console.log("❌ INVOICE FETCH FAILED");

//         const zohoError = error.response?.data || error.message;

//         console.log("FULL ERROR:");
//         console.log(JSON.stringify(zohoError, null, 2));

//         return res.status(500).json({
//             success: false,
//             message: "Invoice Fetch Failed",
//             zoho_error: zohoError
//         });
//     }
// });


// ==========================================
// GLOBAL ERROR HANDLER (ADDED)
// ==========================================

app.use((err, req, res, next) => {
    console.error("🔥 SERVER ERROR:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: err.message
    });
});


// ==========================================
// START SERVER (FIXED)
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("\n==================================");
    console.log("🚀 SERVER RUNNING SUCCESSFULLY");
    console.log("==================================");
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`📡 Network: http://192.168.1.47:${PORT}`);
    console.log("==================================\n");
});