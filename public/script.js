// ======================================
// URL PARAMS
// ======================================

const params = new URLSearchParams(
    window.location.search
);

const invoiceId =
    params.get("invoice_id");

const orgId =
    params.get("org_id");

console.log(
    "Invoice ID:",
    invoiceId
);

console.log(
    "Org ID:",
    orgId
);


// ======================================
// FORMAT AMOUNT
// ======================================

function formatAmount(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// ======================================
// SAFE TEXT SETTER
// ======================================

function setText(id, value) {

    const el =
        document.getElementById(id);

    if (el) {

        el.innerText =
            value || "-";
    }
}


// ======================================
// PRINT
// ======================================

function printInvoice() {

    window.print();
}


// ======================================
// LOAD INVOICE
// ======================================

async function loadInvoice() {

    try {

        // ==================================
        // VALIDATION
        // ==================================

        if (!invoiceId || !orgId) {

            alert(
                "Missing Invoice ID or Org ID"
            );

            return;
        }

        // ==================================
        // API URL
        // ==================================

        const apiUrl =
            `http://127.0.0.1:3000/invoice/${invoiceId}/${orgId}`;

        console.log(apiUrl);

        // ==================================
        // FETCH
        // ==================================

        const response =
            await fetch(apiUrl);

        if (!response.ok) {

            throw new Error(
                "Invoice API Failed"
            );
        }

        const invoice =
            await response.json();

        console.log(invoice);

        // ==================================
        // HEADER
        // ==================================

        setText(
            "invoice_number",
            invoice.invoice_number
        );

        setText(
            "invoice_date",
            invoice.date
        );

        setText(
            "place_of_supply",
            invoice.place_of_supply
        );

        // ==================================
        // BILLING
        // ==================================

        const billing =
            invoice.billing_address || {};

        setText(
            "bill_name",
            invoice.customer_name
        );

        setText(
            "bill_address",
            billing.address
        );

        setText(
            "bill_city",
            billing.city
        );

        setText(
            "bill_state",
            billing.state
        );

        setText(
            "bill_zip",
            billing.zip
        );

        setText(
            "bill_gstin",
            invoice.gst_no
        );

        // ==================================
        // SHIPPING
        // ==================================

        const shipping =
            invoice.shipping_address || {};

        setText(
            "ship_name",
            invoice.customer_name
        );

        setText(
            "ship_address",
            shipping.address
        );

        setText(
            "ship_city",
            shipping.city
        );

        setText(
            "ship_state",
            shipping.state
        );

        setText(
            "ship_zip",
            shipping.zip
        );

        // ==================================
        // META
        // ==================================

        setText(
            "supply_date",
            invoice.date
        );

        setText(
            "customer_po",
            invoice.reference_number
        );

        setText(
            "salesman_name",
            invoice.salesperson_name
        );

        // ==================================
        // TOTALS
        // ==================================

        setText(
            "sub_total",
            formatAmount(
                invoice.sub_total
            )
        );

        setText(
            "tax_total",
            formatAmount(
                invoice.tax_total
            )
        );

        setText(
            "grand_total",
            formatAmount(
                invoice.total
            )
        );

        const halfTax =
            Number(
                invoice.tax_total || 0
            ) / 2;

        setText(
            "sgst_total",
            formatAmount(halfTax)
        );

        setText(
            "cgst_total",
            formatAmount(halfTax)
        );

        // ==================================
        // ITEMS
        // ==================================

        const sizeOrder = [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "OTHERS"
        ];

        let items =
            invoice.line_items || [];

        items.sort((a, b) => {

            const getSize = (item) => {

                const field =
                    (item.item_custom_fields || [])
                    .find(
                        f =>
                            f.label
                                ?.toUpperCase() ===
                            "SIZE"
                    );

                return (
                    field?.value ||
                    "OTHERS"
                );
            };

            return (
                sizeOrder.indexOf(
                    getSize(a)
                ) -
                sizeOrder.indexOf(
                    getSize(b)
                )
            );
        });

        let rows = "";

        let totalQty = 0;

        items.forEach(
            (item, index) => {

                totalQty += Number(
                    item.quantity || 0
                );

                let size =
                    "OTHERS";

                const sizeField =
                    (
                        item.item_custom_fields || []
                    ).find(
                        f =>
                            f.label
                                ?.toUpperCase() ===
                            "SIZE"
                    );

                if (sizeField) {

                    size =
                        sizeField.value ||
                        "OTHERS";
                }

                rows += `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td class="left-text">
                            ${item.name || ""}
                        </td>

                        <td>
                            ${item.hsn_or_sac || ""}
                        </td>

                        <td>
                            ${formatAmount(item.rate)}
                        </td>

                        <td>
                            ${size === "XS" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "S" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "M" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "L" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "XL" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "XXL" ? item.quantity : ""}
                        </td>

                        <td>
                            ${size === "OTHERS" ? item.quantity : ""}
                        </td>

                        <td>
                            ${item.quantity || 0}
                        </td>

                        <td>
                            ${item.tax_percentage || 0}%
                        </td>

                        <td>
                            ${formatAmount(item.rate)}
                        </td>

                        <td>
                            ${formatAmount(item.item_total)}
                        </td>

                    </tr>
                `;
            }
        );

        document.getElementById(
            "items_body"
        ).innerHTML = rows;

        // ==================================
        // FINAL TOTAL
        // ==================================

        setText(
            "total_qty",
            totalQty
        );

        setText(
            "total_amount",
            formatAmount(
                invoice.total
            )
        );

        setText(
            "amount_words",
            invoice.total_in_words ||
            ""
        );

        // ==================================
        // E-INVOICE
        // ==================================

        const einvoice =
            invoice.einvoice_details;

        console.log(
            "E-INVOICE:",
            einvoice
        );

        if (einvoice) {

            // IRN

            setText(
                "irnNumber",
                einvoice.inv_ref_num
            );

            // ACK NUMBER

            setText(
                "ackNumber",
                einvoice.ack_number
            );

            // ACK DATE

            setText(
                "ackDate",
                einvoice.ack_date
            );

            // QR CODE

             const qr = document.getElementById("qrCode");

    if (qr && einvoice.qr_link) {
        qr.src = einvoice.qr_link;
        qr.style.display = "block";
    }
        }

        console.log(
            "Invoice Loaded Successfully"
        );

        // ==================================
        // AUTO PRINT
        // ==================================

        setTimeout(() => {

            window.print();

        }, 1200);

    } catch (error) {

        console.error(error);

        alert(
            "Invoice Load Failed"
        );
    }
}


// ======================================
// INIT
// ======================================

window.onload =
    loadInvoice;